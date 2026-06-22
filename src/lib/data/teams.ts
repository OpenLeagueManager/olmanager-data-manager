import { getEmbeddedCompetition } from "@/data/olmanager/embedded";

export function listTeams() {
  return getEmbeddedCompetition().teams;
}

export function getTeam(id: string) {
  return listTeams().find((team) => team.id === id);
}

export function getTeamsByCompetition(competitionId: string) {
  return getEmbeddedCompetition().competitionTeams[competitionId] ?? [];
}
