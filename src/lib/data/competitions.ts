import { getEmbeddedCompetition } from "@/lib/olmanager/embedded";

export { toRoman } from "./to-roman";

export function listCompetitions() {
  return getEmbeddedCompetition().manifests;
}

export function getCompetition(id: string) {
  return listCompetitions().find((competition) => competition.id === id);
}
