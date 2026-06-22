import "server-only";
import { cache } from "react";
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, sep } from "path";
import type {
  CompetitionManifest,
  MessageSender,
  MessageTrigger,
  NewsTemplate,
  Player,
  SocialAccountData,
  SocialTemplateData,
  Staff,
  Team,
} from "./types";

const DATA_ROOT = join(process.cwd(), "src/data");

function loadJson<T>(...parts: string[]): T {
  const text = readFileSync(join(DATA_ROOT, ...parts), "utf-8");
  return JSON.parse(text) as T;
}

function loadJsonPath<T>(relativePath: string): T {
  const parts = relativePath.split("/");
  return loadJson<T>(...parts);
}

function loadDir<T>(dir: string, glob?: string): T[] {
  const full = join(DATA_ROOT, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith(glob ?? ".json"))
    .map((f) => loadJson<T>(dir, f));
}

function loadDirRecursive<T>(dir: string): T[] {
  const full = join(DATA_ROOT, dir);
  if (!existsSync(full)) return [];
  const results: T[] = [];
  function walk(path: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.name.endsWith(".json")) {
        const text = readFileSync(entryPath, "utf-8");
        results.push(JSON.parse(text) as T);
      }
    }
  }
  walk(full);
  return results;
}

// Competition manifests: src/data/competitions/*/manifest.json
// Sorted by ID for deterministic ordering regardless of filesystem order.
const manifests = readdirSync(join(DATA_ROOT, "competitions"))
  .filter((d) => !d.startsWith("."))
  .map((id) => loadJson<CompetitionManifest>("competitions", id, "manifest.json"))
  .sort((a, b) => a.id.localeCompare(b.id));

// Build competition→data associations from manifest files
// Teams and players use manifest references. Staff uses directory scan because
// manifests have staff_file=null — staff files exist but aren't referenced.
const competitionTeams: Record<string, Team[]> = {};
const competitionPlayers: Record<string, Player[]> = {};

const manifestTeamFiles = new Set<string>();
const manifestPlayerFiles = new Set<string>();

for (const manifest of manifests) {
  if (manifest.teams_file) {
    manifestTeamFiles.add(manifest.teams_file);
    const path = join(DATA_ROOT, ...manifest.teams_file.split("/"));
    if (existsSync(path)) {
      const data = loadJsonPath<{ teams: Team[] }>(manifest.teams_file);
      competitionTeams[manifest.id] = data.teams ?? [];
    }
  }

  if (manifest.players_file) {
    manifestPlayerFiles.add(manifest.players_file);
    const path = join(DATA_ROOT, ...manifest.players_file.split("/"));
    if (existsSync(path)) {
      const data = loadJsonPath<{ players: Player[] }>(manifest.players_file);
      competitionPlayers[manifest.id] = data.players ?? [];
    }
  }
}

// Staff: load from directory (manifests don't reference staff files)
const staffFiles = loadDir<{ staff: Staff[] }>("staffs");

// Flat arrays for list-all accessors
const allTeams = Object.values(competitionTeams).flat();
const allPlayers = Object.values(competitionPlayers).flat();
const allStaff = staffFiles.flatMap((f) => f.staff);

// Social: src/data/social/{accounts,templates}.json
const accounts = existsSync(join(DATA_ROOT, "social", "accounts.json"))
  ? loadJson<SocialAccountData[]>("social", "accounts.json")
  : [];
const socialTemplates = existsSync(join(DATA_ROOT, "social", "templates.json"))
  ? loadJson<{ templates: SocialTemplateData[] }>("social", "templates.json")
  : { templates: [] };

// News: editorial/*.json + season_preview/*.json
const editorialFiles = loadDir<NewsTemplate>("news/editorial");
const previewFiles = loadDir<NewsTemplate>("news/season_preview");

// Messages: senders/*.json + triggers/**/*.json
const senderFiles = loadDir<MessageSender>("messages/senders");
const triggerFiles = loadDirRecursive<MessageTrigger>(
  join("messages", "triggers")
).map((t) => {
  // triggers don't have a nested { trigger } wrapper — direct object
  return t;
});

export type EmbeddedCompetition = {
  manifest: CompetitionManifest;
  manifests: CompetitionManifest[];
  teams: Team[];
  players: Player[];
  staff: Staff[];
  competitionTeams: Record<string, Team[]>;
  competitionPlayers: Record<string, Player[]>;
};

export const getEmbeddedCompetition = cache((): EmbeddedCompetition => {
  const manifest = manifests.find((m) => m.id === "lec") ?? manifests[0]!;
  return {
    manifest,
    manifests,
    teams: allTeams,
    players: allPlayers,
    staff: allStaff,
    competitionTeams,
    competitionPlayers,
  };
});

export function getEmbeddedSocialCatalog() {
  return { accounts, templates: socialTemplates.templates };
}

export function getEmbeddedNewsCatalog() {
  return { editorials: editorialFiles, seasonPreviews: previewFiles };
}

export function getEmbeddedMessageCatalog() {
  return { senders: senderFiles, triggers: triggerFiles };
}
