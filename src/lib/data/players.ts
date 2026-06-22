import { getEmbeddedCompetition } from "@/lib/olmanager/embedded";

export function listPlayers() {
  return getEmbeddedCompetition().players;
}

export function getPlayer(id: string) {
  return listPlayers().find((player) => player.id === id);
}

export function getRoster(teamId: string) {
  const { players, staff } = getEmbeddedCompetition();
  return {
    players: players.filter((player) => player.team_id === teamId),
    staff: staff.filter((member) => member.team_id === teamId),
  };
}
