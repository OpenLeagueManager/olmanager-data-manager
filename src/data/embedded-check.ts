import { embeddedLecCompetition } from "@/data/olmanager/embedded";
import {
  PLAYER_ATTRIBUTE_KEYS,
  STAFF_ATTRIBUTE_KEYS,
  type CompetitionData,
  type Player,
  type Staff,
  type Team,
} from "@/data/olmanager/types";
import { loadCompetition } from "@/data/olmanager/loader";

export class EmbeddedDataDriftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmbeddedDataDriftError";
  }
}

export async function assertEmbeddedInSyncWithData(): Promise<void> {
  const loaded = await loadCompetition("lec");
  assertEmbeddedMatches(loaded, embeddedLecCompetition);
}

export function assertEmbeddedMatches(
  loaded: CompetitionData,
  embedded: CompetitionData,
): void {
  if (loaded.manifest.id !== embedded.manifest.id) {
    throw new EmbeddedDataDriftError(
      `Manifest mismatch: loaded ${loaded.manifest.id} vs embedded ${embedded.manifest.id}`,
    );
  }

  assertTeamsMatch(loaded.teams, embedded.teams);
  assertPlayersMatch(loaded.players, embedded.players);
  assertStaffMatch(loaded.staff, embedded.staff);
}

function assertTeamsMatch(loaded: Team[], embedded: Team[]): void {
  const teamFields = [
    "name",
    "short_name",
    "country",
    "city",
    "wage_budget",
    "transfer_budget",
    "training_focus",
    "training_intensity",
    "active",
  ] as const satisfies readonly (keyof Team)[];

  for (const team of embedded) {
    const loadedTeam = loaded.find((candidate) => candidate.id === team.id);
    if (!loadedTeam) {
      throw new EmbeddedDataDriftError(`Embedded team ${team.id} missing from data/`);
    }

    compareScalarFields(`Team ${team.id}`, loadedTeam, team, teamFields);
  }
}

function assertPlayersMatch(loaded: Player[], embedded: Player[]): void {
  const playerFields = [
    "full_name",
    "match_name",
    "position",
    "team_id",
    "nationality",
    "wage",
    "market_value",
  ] as const satisfies readonly (keyof Player)[];

  for (const player of embedded) {
    const loadedPlayer = loaded.find((candidate) => candidate.id === player.id);
    if (!loadedPlayer) {
      throw new EmbeddedDataDriftError(`Embedded player ${player.id} missing from data/`);
    }

    compareScalarFields(`Player ${player.id}`, loadedPlayer, player, playerFields);

    for (const key of PLAYER_ATTRIBUTE_KEYS) {
      if (loadedPlayer.attributes[key] !== player.attributes[key]) {
        throw new EmbeddedDataDriftError(
          `Player ${player.id} attributes.${key} mismatch: loaded ${loadedPlayer.attributes[key]} vs embedded ${player.attributes[key]}`,
        );
      }
    }
  }
}

function assertStaffMatch(loaded: Staff[], embedded: Staff[]): void {
  const staffFields = [
    "first_name",
    "last_name",
    "role",
    "team_id",
    "nationality",
    "wage",
    "contract_end",
    "date_of_birth",
  ] as const satisfies readonly (keyof Staff)[];

  for (const staff of embedded) {
    const loadedStaff = loaded.find((candidate) => candidate.id === staff.id);
    if (!loadedStaff) {
      throw new EmbeddedDataDriftError(`Embedded staff ${staff.id} missing from data/`);
    }

    compareScalarFields(`Staff ${staff.id}`, loadedStaff, staff, staffFields);

    if (loadedStaff.attributes === null && staff.attributes !== null) {
      throw new EmbeddedDataDriftError(`Staff ${staff.id} attributes missing in data/`);
    }

    if (loadedStaff.attributes !== null && staff.attributes === null) {
      throw new EmbeddedDataDriftError(`Staff ${staff.id} attributes unexpectedly present in data/`);
    }

    if (loadedStaff.attributes && staff.attributes) {
      for (const key of STAFF_ATTRIBUTE_KEYS) {
        if (loadedStaff.attributes[key] !== staff.attributes[key]) {
          throw new EmbeddedDataDriftError(
            `Staff ${staff.id} attributes.${key} mismatch: loaded ${loadedStaff.attributes[key]} vs embedded ${staff.attributes[key]}`,
          );
        }
      }
    }
  }
}

function compareScalarFields<T extends Record<string, unknown>>(
  label: string,
  loaded: T,
  embedded: T,
  fields: readonly (keyof T)[],
): void {
  for (const field of fields) {
    if (loaded[field] !== embedded[field]) {
      throw new EmbeddedDataDriftError(
        `${label} ${String(field)} mismatch: loaded ${String(loaded[field])} vs embedded ${String(embedded[field])}`,
      );
    }
  }
}
