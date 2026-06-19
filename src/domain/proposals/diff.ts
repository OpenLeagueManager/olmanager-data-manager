import { players, teams } from "@/fixtures/olmanager-data";
import type { DiffRecord, ProposalPayload } from "./types";

export function buildProposalDiff(proposal: ProposalPayload): DiffRecord[] {
  switch (proposal.type) {
    case "AddPlayer":
      return [
        record("player.id", null, proposal.player.id),
        record("player.name", null, proposal.player.name),
        record("player.position", null, proposal.player.position),
        record("player.team", null, teamName(proposal.player.teamId)),
        record("player.competitionId", null, proposal.player.competitionId),
        record("player.overall", null, proposal.player.overall),
      ];
    case "EditPlayerAttributes": {
      const player = players.find((candidate) => candidate.id === proposal.playerId);
      if (!player) {
        return [];
      }

      return (["name", "position", "overall"] as const).flatMap((field) => {
        const after = proposal.attributes[field];
        if (after === undefined || player[field] === after) {
          return [];
        }

        return [record(`player.${field}`, player[field], after)];
      });
    }
    case "TransferPlayer": {
      const player = players.find((candidate) => candidate.id === proposal.playerId);
      if (!player) {
        return [];
      }

      const records: DiffRecord[] = [];
      if (player.teamId !== proposal.toTeamId) {
        records.push(record("player.team", teamName(player.teamId), teamName(proposal.toTeamId), "warning"));
      }
      if (player.competitionId !== proposal.competitionId) {
        records.push(
          record("player.competitionId", player.competitionId, proposal.competitionId),
        );
      }

      return records;
    }
  }
}

function record(
  field: string,
  before: unknown,
  after: unknown,
  severity: DiffRecord["severity"] = "info",
): DiffRecord {
  return { field, before, after, severity };
}

function teamName(teamId: string): string {
  return teams.find((team) => team.id === teamId)?.name ?? teamId;
}
