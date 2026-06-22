// Server/test-only module: uses Node fs to read the committed canonical data tree.
// Client components must never import this file; they should receive slices via props
// or use the embedded subset.

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  CompetitionData,
  CompetitionManifest,
  Player,
  Staff,
  Team,
} from "./types";

const DATA_ROOT = join(process.cwd(), "data");

async function readJson<T>(relativePath: string): Promise<T> {
  const filePath = join(DATA_ROOT, relativePath);
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export async function loadCompetitions(): Promise<CompetitionManifest[]> {
  const entries = await readdir(join(DATA_ROOT, "competitions"), { withFileTypes: true });
  const manifests = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => readJson<CompetitionManifest>(`competitions/${entry.name}/manifest.json`)),
  );

  return manifests
    .filter((manifest) => !manifest.legacy && manifest.active)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadCompetition(id: string): Promise<CompetitionData> {
  const manifest = await readJson<CompetitionManifest>(`competitions/${id}/manifest.json`);
  const teamsFile = await readJson<{ teams: Team[] }>(manifest.teams_file);
  const playersFile = await readJson<{ players: Player[] }>(manifest.players_file);
  const staffFile = await readStaffFile(id, manifest.staff_file);

  return {
    manifest,
    teams: teamsFile.teams,
    players: playersFile.players,
    staff: staffFile.staff,
  };
}

async function readStaffFile(
  competitionId: string,
  staffFile: string | null | undefined,
): Promise<{ staff: Staff[] }> {
  if (staffFile) {
    return readJson<{ staff: Staff[] }>(staffFile);
  }

  try {
    return await readJson<{ staff: Staff[] }>(`staffs/${competitionId}_staffs.json`);
  } catch {
    return { staff: [] };
  }
}



