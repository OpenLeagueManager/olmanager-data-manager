import { getEmbeddedCompetition } from "@/data/olmanager/embedded";
import { calculateLolOvr } from "@/data/olmanager/rating";
import type { PlayerAttributes } from "@/data/olmanager/types";
import type { DiffRecord, ProposalPayload } from "./types";

const game = getEmbeddedCompetition();

export function buildProposalDiff(proposal: ProposalPayload): DiffRecord[] {
  switch (proposal.type) {
    case "AddPlayer":
      return [
        record("player.full_name", null, proposal.player.full_name),
        record("player.match_name", null, proposal.player.match_name),
        record("player.position", null, proposal.player.position),
        record("player.team", null, teamName(proposal.player.team_id)),
        record("player.nationality", null, proposal.player.nationality),
        record("player.wage", null, proposal.player.wage),
        record("player.market_value", null, proposal.player.market_value),
        record("player.date_of_birth", null, proposal.player.date_of_birth),
        record("player.contract_end", null, proposal.player.contract_end || "None"),
        record("player.ovr", null, calculateLolOvr(proposal.player.attributes)),
        ...attributeRecords(null, proposal.player.attributes, "player.attributes"),
      ];
    case "EditPlayer": {
      const player = game.players.find((candidate) => candidate.id === proposal.playerId);
      if (!player) {
        return [];
      }

      const records: DiffRecord[] = [];
      const changes = proposal.changes;

      for (const key of [
        "full_name",
        "match_name",
        "position",
        "nationality",
        "wage",
        "market_value",
        "contract_end",
        "transfer_listed",
        "loan_listed",
      ] as const) {
        if (key in changes && player[key] !== changes[key]) {
          records.push(record(`changes.${key}`, player[key], changes[key]));
        }
      }

      if (changes.attributes) {
        records.push(...attributeRecords(player.attributes, changes.attributes, "changes.attributes"));
        const oldOvr = calculateLolOvr(player.attributes);
        const newAttributes = { ...player.attributes, ...changes.attributes };
        const newOvr = calculateLolOvr(newAttributes);
        if (oldOvr !== newOvr) {
          records.push(record("player.ovr", oldOvr, newOvr, "warning"));
        }
      }

      return records;
    }
    case "TransferPlayer": {
      const player = game.players.find((candidate) => candidate.id === proposal.playerId);
      if (!player) {
        return [];
      }

      const records: DiffRecord[] = [];
      if (player.team_id !== proposal.toTeamId) {
        records.push(
          record("player.team", teamName(player.team_id), teamName(proposal.toTeamId), "warning"),
        );
      }
      records.push(record("transfer.fee", null, proposal.fee));
      records.push(record("transfer.wageOffered", null, proposal.wageOffered));
      records.push(record("transfer.contractEnd", null, proposal.contractEnd || "None"));
      return records;
    }
    case "AddStaff":
      return [
        record("staff.first_name", null, proposal.staff.first_name),
        record("staff.last_name", null, proposal.staff.last_name),
        record("staff.role", null, proposal.staff.role),
        record("staff.team", null, teamName(proposal.staff.team_id)),
        record("staff.nationality", null, proposal.staff.nationality),
        record("staff.wage", null, proposal.staff.wage),
        record("staff.contract_end", null, proposal.staff.contract_end || "None"),
        ...staffAttributeRecords(null, proposal.staff.attributes, "staff.attributes"),
      ];
    case "EditStaff": {
      const staff = game.staff.find((candidate) => candidate.id === proposal.staffId);
      if (!staff) {
        return [];
      }

      const records: DiffRecord[] = [];
      for (const key of ["role", "wage", "contract_end"] as const) {
        if (key in proposal.changes && staff[key] !== proposal.changes[key]) {
          records.push(record(`changes.${key}`, staff[key], proposal.changes[key]));
        }
      }
      if (proposal.changes.attributes) {
        records.push(
          ...staffAttributeRecords(
            staff.attributes,
            proposal.changes.attributes,
            "changes.attributes",
          ),
        );
      }
      return records;
    }
    case "ReleaseStaff": {
      const staff = game.staff.find((candidate) => candidate.id === proposal.staffId);
      return [
        record("release.reason", null, proposal.reason),
        record("release.severance", null, proposal.severance ?? 0),
        record("staff.full_name", null, staff ? `${staff.first_name} ${staff.last_name}` : proposal.staffId),
      ];
    }
    case "EditTeam": {
      const team = game.teams.find((candidate) => candidate.id === proposal.teamId);
      if (!team) {
        return [];
      }

      const records: DiffRecord[] = [];
      for (const key of [
        "name",
        "short_name",
        "wage_budget",
        "transfer_budget",
        "training_focus",
        "training_intensity",
      ] as const) {
        if (key in proposal.changes && team[key] !== proposal.changes[key]) {
          records.push(record(`changes.${key}`, team[key], proposal.changes[key]));
        }
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
  return game.teams.find((team) => team.id === teamId)?.name ?? teamId;
}

function attributeRecords(
  before: PlayerAttributes | null,
  after: Partial<PlayerAttributes>,
  prefix: string,
): DiffRecord[] {
  const records: DiffRecord[] = [];
  const base = before ?? ({} as PlayerAttributes);
  for (const [key, value] of Object.entries(after)) {
    if (base[key as keyof PlayerAttributes] !== value) {
      records.push(record(`${prefix}.${key}`, base[key as keyof PlayerAttributes] ?? null, value));
    }
  }
  return records;
}

function staffAttributeRecords(
  before: { coaching: number; physiotherapy: number; judging_ability: number; judging_potential: number } | null,
  after: Partial<{ coaching: number; physiotherapy: number; judging_ability: number; judging_potential: number }>,
  prefix: string,
): DiffRecord[] {
  const records: DiffRecord[] = [];
  const base = before ?? {};
  for (const [key, value] of Object.entries(after)) {
    if ((base as Record<string, number>)[key] !== value) {
      records.push(record(`${prefix}.${key}`, (base as Record<string, number>)[key] ?? null, value));
    }
  }
  return records;
}
