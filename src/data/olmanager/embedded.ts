import manifest from "@/data/embedded/lec/manifest.json";
import playersFile from "@/data/embedded/lec/players.json";
import staffFile from "@/data/embedded/lec/staff.json";
import teamsFile from "@/data/embedded/lec/teams.json";
import type { CompetitionData, Player, Staff, Team } from "./types";

export const embeddedLecCompetition: CompetitionData = {
  manifest,
  teams: teamsFile.teams as Team[],
  players: playersFile.players as Player[],
  staff: staffFile.staff as Staff[],
};

export function getEmbeddedCompetition(): CompetitionData {
  return embeddedLecCompetition;
}

export function getEmbeddedPlayer(id: string): Player | undefined {
  return embeddedLecCompetition.players.find((player) => player.id === id);
}

export function getEmbeddedTeam(id: string): Team | undefined {
  return embeddedLecCompetition.teams.find((team) => team.id === id);
}

export function getEmbeddedStaff(id: string): Staff | undefined {
  return embeddedLecCompetition.staff.find((staff) => staff.id === id);
}
