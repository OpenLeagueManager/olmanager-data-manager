import { getEmbeddedCompetition } from "@/data/olmanager/embedded";
import {
  PLAYER_RATING_ERROR_MESSAGE,
  PLAYER_RATING_MAX,
  PLAYER_RATING_MIN,
} from "@/data/olmanager/rating";
import {
  LOL_ROLES,
  PLAYER_ATTRIBUTE_KEYS,
  STAFF_ATTRIBUTE_KEYS,
  type LoLRole,
  type PlayerAttributes,
  type StaffAttributes,
} from "@/data/olmanager/types";
import { PROPOSAL_TYPE_METADATA, SUPPORTED_PROPOSAL_TYPE_NAMES } from "./metadata";
import type {
  AddPlayerPayload,
  AddStaffPayload,
  EditPlayerPayload,
  EditStaffPayload,
  EditTeamPayload,
  FieldError,
  ProposalPayload,
  ProposalType,
  ReleaseStaffPayload,
  TransferPlayerPayload,
  ValidationResult,
} from "./types";

const RELEASE_REASONS = ["fired", "resigned", "contract_end", "mutual"] as const;

const game = getEmbeddedCompetition();

type RawRecord = Record<string, unknown>;

export function parseProposalType(value: unknown): ValidationResult<ProposalType> {
  const supported = Object.keys(PROPOSAL_TYPE_METADATA) as ProposalType[];
  if (supported.includes(value as ProposalType)) {
    return { ok: true, value: value as ProposalType };
  }

  return {
    ok: false,
    errors: [
      {
        field: "type",
        message: `Unsupported proposal type. Supported PR2 types: ${SUPPORTED_PROPOSAL_TYPE_NAMES}.`,
      },
    ],
  };
}

export function validateProposal(input: unknown): ValidationResult<ProposalPayload> {
  if (!isRecord(input)) {
    return fieldFailure("proposal", "Proposal must be an object.");
  }

  if (input.version !== 2) {
    return fieldFailure("version", "Proposal version must be 2.");
  }

  const typeResult = parseProposalType(input.type);
  if (!typeResult.ok) {
    return typeResult;
  }

  switch (typeResult.value) {
    case "AddPlayer":
      return validateAddPlayer(input);
    case "EditPlayer":
      return validateEditPlayer(input);
    case "TransferPlayer":
      return validateTransferPlayer(input);
    case "AddStaff":
      return validateAddStaff(input);
    case "EditStaff":
      return validateEditStaff(input);
    case "ReleaseStaff":
      return validateReleaseStaff(input);
    case "EditTeam":
      return validateEditTeam(input);
    default:
      return fieldFailure("type", `${typeResult.value} is not implemented in this slice.`);
  }
}

function validateAddPlayer(input: RawRecord): ValidationResult<AddPlayerPayload> {
  const errors: FieldError[] = [];
  const player = isRecord(input.player) ? input.player : undefined;

  if (!player) {
    return fieldFailure("player", "Player details are required.");
  }

  const full_name = readString(player.full_name, "player.full_name", errors);
  const match_name = readString(player.match_name, "player.match_name", errors);
  const position = readRole(player.position, "player.position", errors);
  const team_id = readTeamId(player.team_id, "player.team_id", errors);
  const nationality = readString(player.nationality, "player.nationality", errors);
  const wage = readInteger(player.wage, "player.wage", errors, { min: 0 });
  const market_value = readInteger(player.market_value, "player.market_value", errors, { min: 0 });
  const date_of_birth = readDate(player.date_of_birth, "player.date_of_birth", errors);
  const contract_end = readDate(player.contract_end, "player.contract_end", errors, {
    allowEmpty: true,
  });
  const attributes = readPlayerAttributes(player.attributes, "player.attributes", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      version: 2,
      type: "AddPlayer",
      player: {
        full_name,
        match_name,
        position: position as LoLRole,
        team_id,
        nationality,
        wage,
        market_value,
        attributes,
        date_of_birth,
        contract_end,
      },
    },
  };
}

function validateEditPlayer(input: RawRecord): ValidationResult<EditPlayerPayload> {
  const errors: FieldError[] = [];
  const playerId = readString(input.playerId, "playerId", errors);
  const player = game.players.find((candidate) => candidate.id === playerId);

  if (playerId && !player) {
    errors.push({ field: "playerId", message: "Player does not exist." });
  }

  const changes = isRecord(input.changes) ? input.changes : undefined;
  if (!changes) {
    return fieldFailure("changes", "Changes are required.");
  }

  const normalizedChanges: EditPlayerPayload["changes"] = {};

  if ("full_name" in changes) {
    normalizedChanges.full_name = readString(changes.full_name, "changes.full_name", errors);
  }
  if ("match_name" in changes) {
    normalizedChanges.match_name = readString(changes.match_name, "changes.match_name", errors);
  }
  if ("position" in changes) {
    normalizedChanges.position = readRole(changes.position, "changes.position", errors) as LoLRole;
  }
  if ("nationality" in changes) {
    normalizedChanges.nationality = readString(
      changes.nationality,
      "changes.nationality",
      errors,
    );
  }
  if ("wage" in changes) {
    normalizedChanges.wage = readInteger(changes.wage, "changes.wage", errors, { min: 0 });
  }
  if ("market_value" in changes) {
    normalizedChanges.market_value = readInteger(
      changes.market_value,
      "changes.market_value",
      errors,
      { min: 0 },
    );
  }
  if ("contract_end" in changes) {
    normalizedChanges.contract_end = readDate(
      changes.contract_end,
      "changes.contract_end",
      errors,
      { allowEmpty: true },
    );
  }
  if ("transfer_listed" in changes) {
    normalizedChanges.transfer_listed = readBoolean(
      changes.transfer_listed,
      "changes.transfer_listed",
      errors,
    );
  }
  if ("loan_listed" in changes) {
    normalizedChanges.loan_listed = readBoolean(
      changes.loan_listed,
      "changes.loan_listed",
      errors,
    );
  }
  if ("attributes" in changes) {
    if (!isRecord(changes.attributes)) {
      errors.push({ field: "changes.attributes", message: "Attributes must be an object." });
    } else {
      normalizedChanges.attributes = readPartialPlayerAttributes(
        changes.attributes,
        "changes.attributes",
        errors,
      );
    }
  }

  if (Object.keys(normalizedChanges).length === 0) {
    errors.push({ field: "changes", message: "At least one change is required." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { version: 2, type: "EditPlayer", playerId, changes: normalizedChanges },
  };
}

function validateTransferPlayer(input: RawRecord): ValidationResult<TransferPlayerPayload> {
  const errors: FieldError[] = [];
  const playerId = readString(input.playerId, "playerId", errors);
  const fromTeamId = readString(input.fromTeamId, "fromTeamId", errors);
  const toTeamId = readString(input.toTeamId, "toTeamId", errors);
  const competitionId = readString(input.competitionId, "competitionId", errors);
  const wageOffered = readInteger(input.wageOffered, "wageOffered", errors, { min: 0 });
  const fee = readInteger(input.fee, "fee", errors, { min: 0 });
  const contractEnd = readDate(input.contractEnd, "contractEnd", errors, { allowEmpty: true });

  const player = game.players.find((candidate) => candidate.id === playerId);
  const sourceTeam = game.teams.find((team) => team.id === fromTeamId);
  const destinationTeam = game.teams.find((team) => team.id === toTeamId);
  const competition = game.manifest.id === competitionId ? game.manifest : undefined;

  if (playerId && !player) {
    errors.push({ field: "playerId", message: "Player does not exist." });
  }
  if (fromTeamId && !sourceTeam) {
    errors.push({ field: "fromTeamId", message: "Source team does not exist." });
  }
  if (toTeamId && !destinationTeam) {
    errors.push({ field: "toTeamId", message: "Destination team does not exist." });
  }
  if (competitionId && !competition) {
    errors.push({ field: "competitionId", message: "Competition does not exist." });
  }
  if (sourceTeam && destinationTeam && fromTeamId === toTeamId) {
    errors.push({ field: "toTeamId", message: "Destination team must differ from source team." });
  }
  if (player && sourceTeam && player.team_id !== fromTeamId) {
    errors.push({ field: "fromTeamId", message: "Source team does not match player's current team." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      version: 2,
      type: "TransferPlayer",
      playerId,
      fromTeamId,
      toTeamId,
      competitionId,
      wageOffered,
      fee,
      contractEnd,
    },
  };
}

function validateAddStaff(input: RawRecord): ValidationResult<AddStaffPayload> {
  const errors: FieldError[] = [];
  const staff = isRecord(input.staff) ? input.staff : undefined;

  if (!staff) {
    return fieldFailure("staff", "Staff details are required.");
  }

  const first_name = readString(staff.first_name, "staff.first_name", errors);
  const last_name = readString(staff.last_name, "staff.last_name", errors);
  const role = readString(staff.role, "staff.role", errors);
  const team_id = readTeamId(staff.team_id, "staff.team_id", errors);
  const nationality = readString(staff.nationality, "staff.nationality", errors);
  const wage = readInteger(staff.wage, "staff.wage", errors, { min: 0 });
  const contract_end = readDate(staff.contract_end, "staff.contract_end", errors, {
    allowEmpty: true,
  });
  const date_of_birth = readDate(staff.date_of_birth, "staff.date_of_birth", errors);
  const attributes = readStaffAttributes(staff.attributes, "staff.attributes", errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      version: 2,
      type: "AddStaff",
      staff: {
        first_name,
        last_name,
        role,
        team_id,
        nationality,
        wage,
        attributes,
        contract_end,
        date_of_birth,
      },
    },
  };
}

function validateEditStaff(input: RawRecord): ValidationResult<EditStaffPayload> {
  const errors: FieldError[] = [];
  const staffId = readString(input.staffId, "staffId", errors);
  const staff = game.staff.find((candidate) => candidate.id === staffId);

  if (staffId && !staff) {
    errors.push({ field: "staffId", message: "Staff member does not exist." });
  }

  const changes = isRecord(input.changes) ? input.changes : undefined;
  if (!changes) {
    return fieldFailure("changes", "Changes are required.");
  }

  const normalizedChanges: EditStaffPayload["changes"] = {};

  if ("role" in changes) {
    normalizedChanges.role = readString(changes.role, "changes.role", errors);
  }
  if ("wage" in changes) {
    normalizedChanges.wage = readInteger(changes.wage, "changes.wage", errors, { min: 0 });
  }
  if ("contract_end" in changes) {
    normalizedChanges.contract_end = readDate(
      changes.contract_end,
      "changes.contract_end",
      errors,
      { allowEmpty: true },
    );
  }
  if ("attributes" in changes) {
    if (!isRecord(changes.attributes)) {
      errors.push({ field: "changes.attributes", message: "Attributes must be an object." });
    } else {
      normalizedChanges.attributes = readPartialStaffAttributes(
        changes.attributes,
        "changes.attributes",
        errors,
      );
    }
  }

  if (Object.keys(normalizedChanges).length === 0) {
    errors.push({ field: "changes", message: "At least one change is required." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { version: 2, type: "EditStaff", staffId, changes: normalizedChanges },
  };
}

function validateReleaseStaff(input: RawRecord): ValidationResult<ReleaseStaffPayload> {
  const errors: FieldError[] = [];
  const staffId = readString(input.staffId, "staffId", errors);
  const reason = readEnum(
    input.reason,
    "reason",
    RELEASE_REASONS as unknown as readonly string[],
    errors,
  ) as ReleaseStaffPayload["reason"] | "";
  const severance = input.severance !== undefined
    ? readInteger(input.severance, "severance", errors, { min: 0 })
    : undefined;

  const staff = game.staff.find((candidate) => candidate.id === staffId);
  if (staffId && !staff) {
    errors.push({ field: "staffId", message: "Staff member does not exist." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      version: 2,
      type: "ReleaseStaff",
      staffId,
      reason: reason || "mutual",
      severance,
    },
  };
}

function validateEditTeam(input: RawRecord): ValidationResult<EditTeamPayload> {
  const errors: FieldError[] = [];
  const teamId = readString(input.teamId, "teamId", errors);
  const team = game.teams.find((candidate) => candidate.id === teamId);

  if (teamId && !team) {
    errors.push({ field: "teamId", message: "Team does not exist." });
  }

  const changes = isRecord(input.changes) ? input.changes : undefined;
  if (!changes) {
    return fieldFailure("changes", "Changes are required.");
  }

  const normalizedChanges: EditTeamPayload["changes"] = {};

  if ("name" in changes) {
    normalizedChanges.name = readString(changes.name, "changes.name", errors);
  }
  if ("short_name" in changes) {
    normalizedChanges.short_name = readString(changes.short_name, "changes.short_name", errors);
  }
  if ("wage_budget" in changes) {
    normalizedChanges.wage_budget = readInteger(
      changes.wage_budget,
      "changes.wage_budget",
      errors,
      { min: 0 },
    );
  }
  if ("transfer_budget" in changes) {
    normalizedChanges.transfer_budget = readInteger(
      changes.transfer_budget,
      "changes.transfer_budget",
      errors,
      { min: 0 },
    );
  }
  if ("training_focus" in changes) {
    normalizedChanges.training_focus = readString(
      changes.training_focus,
      "changes.training_focus",
      errors,
    );
  }
  if ("training_intensity" in changes) {
    normalizedChanges.training_intensity = readString(
      changes.training_intensity,
      "changes.training_intensity",
      errors,
    );
  }

  if (Object.keys(normalizedChanges).length === 0) {
    errors.push({ field: "changes", message: "At least one change is required." });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { version: 2, type: "EditTeam", teamId, changes: normalizedChanges },
  };
}

function readString(value: unknown, field: string, errors: FieldError[]): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  errors.push({ field, message: "A non-empty string is required." });
  return "";
}

function readDate(
  value: unknown,
  field: string,
  errors: FieldError[],
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): string {
  if (typeof value !== "string") {
    errors.push({ field, message: "A valid ISO date (YYYY-MM-DD) is required." });
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    if (allowEmpty) {
      return "";
    }

    errors.push({ field, message: "A valid ISO date (YYYY-MM-DD) is required." });
    return "";
  }

  if (!isValidIsoDate(trimmed)) {
    errors.push({ field, message: "A valid ISO date (YYYY-MM-DD) is required." });
    return "";
  }

  return trimmed;
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
  );
}

function readInteger(
  value: unknown,
  field: string,
  errors: FieldError[],
  { min }: { min?: number } = {},
): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    if (min !== undefined && value < min) {
      errors.push({ field, message: `Must be at least ${min}.` });
      return min;
    }
    return value;
  }

  errors.push({ field, message: "A valid integer is required." });
  return min ?? 0;
}

function readBoolean(value: unknown, field: string, errors: FieldError[]): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  errors.push({ field, message: "A boolean value is required." });
  return false;
}

function readRole(value: unknown, field: string, errors: FieldError[]): LoLRole | "" {
  const normalized = typeof value === "string" ? value.trim() : "";
  const matched = LOL_ROLES.find(
    (role) => role.toLowerCase() === normalized.toLowerCase(),
  );
  if (matched) {
    return matched;
  }

  errors.push({ field, message: "A supported LoL role is required." });
  return "";
}

function readTeamId(value: unknown, field: string, errors: FieldError[]): string {
  const teamId = readString(value, field, errors);
  if (teamId && !game.teams.some((team) => team.id === teamId)) {
    errors.push({ field, message: "Team does not exist." });
  }
  return teamId;
}

function readPlayerAttributes(
  value: unknown,
  field: string,
  errors: FieldError[],
): PlayerAttributes {
  const attributes: Partial<PlayerAttributes> = {};
  const source = isRecord(value) ? value : {};

  for (const key of PLAYER_ATTRIBUTE_KEYS) {
    attributes[key] = readAttributeNumber(source[key], `${field}.${key}`, errors);
  }

  return attributes as PlayerAttributes;
}

function readPartialPlayerAttributes(
  value: unknown,
  field: string,
  errors: FieldError[],
): Partial<PlayerAttributes> {
  const attributes: Partial<PlayerAttributes> = {};
  const source = isRecord(value) ? value : {};

  for (const key of PLAYER_ATTRIBUTE_KEYS) {
    if (key in source) {
      attributes[key] = readAttributeNumber(source[key], `${field}.${key}`, errors);
    }
  }

  return attributes;
}

function readStaffAttributes(
  value: unknown,
  field: string,
  errors: FieldError[],
): StaffAttributes {
  const attributes: Partial<StaffAttributes> = {};
  const source = isRecord(value) ? value : {};

  for (const key of STAFF_ATTRIBUTE_KEYS) {
    attributes[key] = readAttributeNumber(source[key], `${field}.${key}`, errors);
  }

  return attributes as StaffAttributes;
}

function readPartialStaffAttributes(
  value: unknown,
  field: string,
  errors: FieldError[],
): Partial<StaffAttributes> {
  const attributes: Partial<StaffAttributes> = {};
  const source = isRecord(value) ? value : {};

  for (const key of STAFF_ATTRIBUTE_KEYS) {
    if (key in source) {
      attributes[key] = readAttributeNumber(source[key], `${field}.${key}`, errors);
    }
  }

  return attributes;
}

function readAttributeNumber(value: unknown, field: string, errors: FieldError[]): number {
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

function readEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly string[],
  errors: FieldError[],
): T | "" {
  if (typeof value === "string" && allowed.includes(value)) {
    return value as T;
  }

  errors.push({ field, message: `Must be one of: ${allowed.join(", ")}.` });
  return "";
}

function fieldFailure(field: string, message: string): ValidationResult<never> {
  return { ok: false, errors: [{ field, message }] };
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
