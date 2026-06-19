import { competitions, players, teams } from "@/fixtures/olmanager-data";
import { SUPPORTED_PROPOSAL_TYPES } from "./metadata";
import { PLAYER_RATING_ERROR_MESSAGE, PLAYER_RATING_MAX, PLAYER_RATING_MIN } from "./rating";
import type {
  AddPlayerPayload,
  EditablePlayerAttributes,
  FieldError,
  PlayerPosition,
  ProposalPayload,
  ProposalType,
  TransferPlayerPayload,
  ValidationResult,
} from "./types";

const positions = ["GK", "DF", "MF", "FW"] as const satisfies readonly PlayerPosition[];

type RawRecord = Record<string, unknown>;

export function parseProposalType(value: unknown): ValidationResult<ProposalType> {
  if (SUPPORTED_PROPOSAL_TYPES.includes(value as ProposalType)) {
    return { ok: true, value: value as ProposalType };
  }

  return {
    ok: false,
    errors: [
      {
        field: "type",
        message: "Unsupported proposal type.",
      },
    ],
  };
}

export function validateProposal(input: unknown): ValidationResult<ProposalPayload> {
  if (!isRecord(input)) {
    return fieldFailure("proposal", "Proposal must be an object.");
  }

  const typeResult = parseProposalType(input.type);
  if (!typeResult.ok) {
    return typeResult;
  }

  switch (typeResult.value) {
    case "AddPlayer":
      return validateAddPlayer(input);
    case "EditPlayerAttributes":
      return validateEditPlayerAttributes(input);
    case "TransferPlayer":
      return validateTransferPlayer(input);
  }
}

function validateAddPlayer(input: RawRecord): ValidationResult<AddPlayerPayload> {
  const errors: FieldError[] = [];
  const player = isRecord(input.player) ? input.player : undefined;

  if (!player) {
    return fieldFailure("player", "Player details are required.");
  }

  const id = readString(player.id, "player.id", errors);
  const name = readString(player.name, "player.name", errors);
  const position = readPosition(player.position, "player.position", errors);
  const teamId = readString(player.teamId, "player.teamId", errors);
  const competitionId = readString(
    player.competitionId,
    "player.competitionId",
    errors,
  );
  const overall = readRating(player.overall, "player.overall", errors);

  if (id && players.some((candidate) => candidate.id === id)) {
    errors.push({ field: "player.id", message: "Player ID already exists." });
  }

  pushTeamCompetitionErrors(teamId, competitionId, "player", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      type: "AddPlayer",
      player: { id, name, position, teamId, competitionId, overall },
    },
  };
}

function validateEditPlayerAttributes(
  input: RawRecord,
): ValidationResult<ProposalPayload> {
  const errors: FieldError[] = [];
  const playerId = readString(input.playerId, "playerId", errors);
  const attributes = isRecord(input.attributes) ? input.attributes : undefined;

  if (playerId && !players.some((player) => player.id === playerId)) {
    errors.push({ field: "playerId", message: "Player does not exist." });
  }

  if (!attributes) {
    errors.push({ field: "attributes", message: "Attributes are required." });
  }

  const normalizedAttributes: EditablePlayerAttributes = {};
  if (attributes) {
    if ("name" in attributes) {
      normalizedAttributes.name = readString(attributes.name, "attributes.name", errors);
    }
    if ("position" in attributes) {
      normalizedAttributes.position = readPosition(
        attributes.position,
        "attributes.position",
        errors,
      );
    }
    if ("overall" in attributes) {
      normalizedAttributes.overall = readRating(
        attributes.overall,
        "attributes.overall",
        errors,
      );
    }

    if (Object.keys(normalizedAttributes).length === 0) {
      errors.push({
        field: "attributes",
        message: "At least one editable attribute is required.",
      });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      type: "EditPlayerAttributes",
      playerId,
      attributes: normalizedAttributes,
    },
  };
}

function validateTransferPlayer(
  input: RawRecord,
): ValidationResult<TransferPlayerPayload> {
  const errors: FieldError[] = [];
  const playerId = readString(input.playerId, "playerId", errors);
  const fromTeamId = readString(input.fromTeamId, "fromTeamId", errors);
  const toTeamId = readString(input.toTeamId, "toTeamId", errors);
  const competitionId = readString(input.competitionId, "competitionId", errors);
  const player = players.find((candidate) => candidate.id === playerId);

  if (playerId && !player) {
    errors.push({ field: "playerId", message: "Player does not exist." });
  }
  const sourceTeam = teams.find((team) => team.id === fromTeamId);
  if (fromTeamId && !sourceTeam) {
    errors.push({ field: "fromTeamId", message: "Source team does not exist." });
  }
  const destinationTeam = teams.find((team) => team.id === toTeamId);
  if (toTeamId && !destinationTeam) {
    errors.push({ field: "toTeamId", message: "Destination team does not exist." });
  }
  if (
    competitionId &&
    !competitions.some((competition) => competition.id === competitionId)
  ) {
    errors.push({ field: "competitionId", message: "Competition does not exist." });
  }
  if (sourceTeam && destinationTeam && fromTeamId === toTeamId) {
    errors.push({ field: "toTeamId", message: "Destination team must differ from source team." });
  }
  if (player && sourceTeam && player.teamId !== fromTeamId) {
    errors.push({ field: "fromTeamId", message: "Source team does not match player's current team." });
  }
  if (destinationTeam && competitionId && destinationTeam.competitionId !== competitionId) {
    errors.push({
      field: "competitionId",
      message: "Competition does not match the destination team.",
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { type: "TransferPlayer", playerId, fromTeamId, toTeamId, competitionId },
  };
}

function pushTeamCompetitionErrors(
  teamId: string,
  competitionId: string,
  fieldPrefix: string,
  errors: FieldError[],
) {
  const team = teams.find((candidate) => candidate.id === teamId);
  if (teamId && !team) {
    errors.push({ field: `${fieldPrefix}.teamId`, message: "Team does not exist." });
  }
  if (
    competitionId &&
    !competitions.some((competition) => competition.id === competitionId)
  ) {
    errors.push({ field: `${fieldPrefix}.competitionId`, message: "Competition does not exist." });
  }
  if (team && competitionId && team.competitionId !== competitionId) {
    errors.push({
      field: `${fieldPrefix}.competitionId`,
      message: "Competition does not match the selected team.",
    });
  }
}

function readString(value: unknown, field: string, errors: FieldError[]): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  errors.push({ field, message: "A non-empty string is required." });
  return "";
}

function readPosition(
  value: unknown,
  field: string,
  errors: FieldError[],
): PlayerPosition {
  if (positions.includes(value as PlayerPosition)) {
    return value as PlayerPosition;
  }

  errors.push({ field, message: "A supported player position is required." });
  return "MF";
}

function readRating(value: unknown, field: string, errors: FieldError[]): number {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= PLAYER_RATING_MIN &&
    value <= PLAYER_RATING_MAX
  ) {
    return value;
  }

  errors.push({ field, message: PLAYER_RATING_ERROR_MESSAGE });
  return PLAYER_RATING_MIN;
}

function fieldFailure(field: string, message: string): ValidationResult<never> {
  return { ok: false, errors: [{ field, message }] };
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
