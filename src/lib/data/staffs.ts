import { getEmbeddedCompetition } from "@/lib/olmanager/embedded";

export function listStaffs() {
  return getEmbeddedCompetition().staff;
}

export function getStaff(id: string) {
  return listStaffs().find((member) => member.id === id);
}

export function getStaffByTeam(teamId: string) {
  return listStaffs().filter((member) => member.team_id === teamId);
}
