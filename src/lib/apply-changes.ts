import "server-only";

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getEmbeddedCompetition } from "@/lib/olmanager/embedded";
import type { CompetitionManifest, Team, Player, Staff } from "@/lib/olmanager/types";

const DATA_ROOT = join(process.cwd(), "src/data");

/**
 * Parse a proposal issue body back into structured data and apply changes
 * to the corresponding data files. Returns files ready for commitToDataRepo.
 */
export function applyProposalChanges(
  body: string,
): Array<{ path: string; content: string }> | null {
  const parsed = parseBody(body);
  if (!parsed) return null;

  const { type, fields } = parsed;

  switch (type) {
    case "EditPlayer":
      return applyEditPlayer(fields);
    case "EditStaff":
      return applyEditStaff(fields);
    case "EditTeam":
      return applyEditTeam(fields);
    case "EditCompetition":
      return applyEditCompetition(fields);
    case "TransferPlayer":
      return applyTransferPlayer(fields);
    default:
      // For add/remove types, return empty — these are informational
      return [];
  }
}

// ---- Parsing ----

type ParsedProposal = {
  type: string;
  fields: Record<string, unknown>;
  subFields: Record<string, Record<string, unknown>>;
};

function parseBody(body: string): ParsedProposal | null {
  const lines = body.split("\n");
  const fields: Record<string, unknown> = {};
  const subFields: Record<string, Record<string, unknown>> = {};
  let type = "";
  let currentSection = "";

  for (const line of lines) {
    // ## Type
    if (line.startsWith("## ")) {
      type = line.slice(3).trim();
      continue;
    }

    // ### Section
    if (line.startsWith("### ")) {
      currentSection = line.slice(4).trim().toLowerCase();
      if (!subFields[currentSection]) {
        subFields[currentSection] = {};
      }
      continue;
    }

    // - **key**: value
    const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
    if (match) {
      const key = match[1].trim();
      const rawValue = match[2].trim();
      const value = parseValue(rawValue);

      if (currentSection) {
        subFields[currentSection][key] = value;
      } else {
        fields[key] = value;
      }
    }
  }

  if (!type) return null;
  return { type, fields: normalizeKeys(fields), subFields };
}

function parseValue(raw: string): unknown {
  if (raw === "—" || raw === "") return undefined;
  if (raw === "Yes") return true;
  if (raw === "No") return false;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^\d[\d,]*$/.test(raw)) return parseInt(raw.replace(/,/g, ""), 10);
  return raw;
}

function normalizeKeys(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key.toLowerCase().replace(/\s+/g, "_")] = value;
  }
  return result;
}

// ---- Data file helpers ----

function readDataFile(relativePath: string): Record<string, unknown> | null {
  const fullPath = join(DATA_ROOT, relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, "utf-8"));
}

function findPlayerFile(playerId: string): string | null {
  const comp = getEmbeddedCompetition();
  for (const [compId, players] of Object.entries(comp.competitionPlayers)) {
    if (players.some((p) => p.id === playerId)) {
      const manifest = comp.manifests.find((m) => m.id === compId);
      if (manifest?.players_file) return manifest.players_file;
    }
  }
  // Fallback: search all player files
  return null;
}

function findTeamFile(teamId: string): string | null {
  const comp = getEmbeddedCompetition();
  for (const [compId, teams] of Object.entries(comp.competitionTeams)) {
    if (teams.some((t) => t.id === teamId)) {
      const manifest = comp.manifests.find((m) => m.id === compId);
      if (manifest?.teams_file) return manifest.teams_file;
    }
  }
  return null;
}

function findCompetitionFile(): string {
  // Competition manifests are individual files per competition
  return "competitions"; // handled differently
}

// ---- Apply functions ----

function applyEditPlayer(fields: Record<string, unknown>): Array<{ path: string; content: string }> | null {
  const playerId = fields.player_id as string;
  if (!playerId) return null;

  const filePath = findPlayerFile(playerId);
  if (!filePath) return null;

  const data = readDataFile(filePath);
  if (!data?.players) return null;

  const players = data.players as Player[];
  const idx = players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;

  const changes = fields.changes as Record<string, unknown> | undefined;
  if (!changes) return null;

  const player = { ...players[idx] };

  // Apply scalar changes
  const scalarFields = ["full_name", "match_name", "position", "nationality", "wage", "market_value", "contract_end"];
  for (const f of scalarFields) {
    if (changes[f] !== undefined) {
      (player as Record<string, unknown>)[f] = changes[f];
    }
  }

  if (changes.transfer_listed !== undefined) player.transfer_listed = changes.transfer_listed as boolean;
  if (changes.loan_listed !== undefined) player.loan_listed = changes.loan_listed as boolean;

  // Apply attribute changes
  if (changes.attributes && typeof changes.attributes === "object") {
    const attrs = changes.attributes as Record<string, number>;
    for (const [key, value] of Object.entries(attrs)) {
      if (value !== undefined) {
        (player.attributes as Record<string, number>)[key] = value;
      }
    }
  }

  players[idx] = player;
  return [{ path: filePath, content: JSON.stringify(data, null, 2) + "\n" }];
}

function applyEditStaff(fields: Record<string, unknown>): Array<{ path: string; content: string }> | null {
  const staffId = fields.staff_id as string;
  if (!staffId) return null;

  const comp = getEmbeddedCompetition();
  // Staff files aren't manifest-referenced, search all
  for (const manifest of comp.manifests) {
    const sf = manifest.staff_file;
    if (!sf) continue;
    const data = readDataFile(sf);
    if (!data?.staff) continue;

    const staffList = data.staff as Staff[];
    const idx = staffList.findIndex((s) => s.id === staffId);
    if (idx === -1) continue;

    const changes = fields.changes as Record<string, unknown> | undefined;
    if (!changes) return null;

    const staff = { ...staffList[idx] };
    if (changes.role !== undefined) staff.role = changes.role as string;
    if (changes.wage !== undefined) staff.wage = changes.wage as number;
    if (changes.contract_end !== undefined) staff.contract_end = changes.contract_end as string;

    if (changes.attributes && typeof changes.attributes === "object") {
      const attrs = changes.attributes as Record<string, number>;
      if (!staff.attributes) staff.attributes = {} as Staff["attributes"];
      for (const [key, value] of Object.entries(attrs)) {
        if (value !== undefined) {
          (staff.attributes as Record<string, number>)[key] = value;
        }
      }
    }

    staffList[idx] = staff;
    return [{ path: sf, content: JSON.stringify(data, null, 2) + "\n" }];
  }
  return null;
}

function applyEditTeam(fields: Record<string, unknown>): Array<{ path: string; content: string }> | null {
  const teamId = fields.team_id as string;
  if (!teamId) return null;

  const filePath = findTeamFile(teamId);
  if (!filePath) return null;

  const data = readDataFile(filePath);
  if (!data?.teams) return null;

  const teams = data.teams as Team[];
  const idx = teams.findIndex((t) => t.id === teamId);
  if (idx === -1) return null;

  const changes = fields.changes as Record<string, unknown> | undefined;
  if (!changes) return null;

  const team = { ...teams[idx] };
  const scalarFields = ["name", "short_name", "wage_budget", "transfer_budget", "training_focus", "training_intensity"];
  for (const f of scalarFields) {
    if (changes[f] !== undefined) {
      (team as Record<string, unknown>)[f] = changes[f];
    }
  }

  teams[idx] = team;
  return [{ path: filePath, content: JSON.stringify(data, null, 2) + "\n" }];
}

function applyEditCompetition(fields: Record<string, unknown>): Array<{ path: string; content: string }> | null {
  const competitionId = fields.competition_id as string;
  if (!competitionId) return null;

  const filePath = `competitions/${competitionId}/manifest.json`;
  const data = readDataFile(filePath);
  if (!data) return null;

  const changes = fields.changes as Record<string, unknown> | undefined;
  if (!changes) return null;

  const manifest = data as CompetitionManifest;
  const scalarFields = ["name", "full_name", "logo", "tier"];
  for (const f of scalarFields) {
    if (changes[f] !== undefined) {
      (manifest as Record<string, unknown>)[f] = changes[f];
    }
  }
  if (changes.active !== undefined) (manifest as Record<string, unknown>).active = changes.active;

  return [{ path: filePath, content: JSON.stringify(data, null, 2) + "\n" }];
}

function applyTransferPlayer(fields: Record<string, unknown>): Array<{ path: string; content: string }> | null {
  const playerId = fields.player_id as string;
  const toTeamId = fields.to_team_id as string;
  if (!playerId || !toTeamId) return null;

  const filePath = findPlayerFile(playerId);
  if (!filePath) return null;

  const data = readDataFile(filePath);
  if (!data?.players) return null;

  const players = data.players as Player[];
  const idx = players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;

  players[idx] = { ...players[idx], team_id: toTeamId };

  if (fields.wage_offered !== undefined) {
    players[idx].wage = fields.wage_offered as number;
  }
  if (fields.contract_end !== undefined) {
    players[idx].contract_end = fields.contract_end as string;
  }

  return [{ path: filePath, content: JSON.stringify(data, null, 2) + "\n" }];
}
