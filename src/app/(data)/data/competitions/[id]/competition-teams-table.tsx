"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { toRoman } from "@/lib/data/to-roman";
import type { Team } from "@/data/olmanager/types";

export function CompetitionTeamsTable({
  teams,
  competitionName,
}: {
  teams: Team[];
  competitionName: string;
}) {
  return (
    <DataTable
      rows={teams}
      caption={`Teams in ${competitionName}`}
      empty="No teams in this competition."
      columns={[
        {
          key: "name",
          header: "Team",
          render: (team) => (
            <span className="border-l-4 pl-2" style={{ borderColor: team.colors?.primary ?? "#888888" }}>
              <Link className="font-medium hover:underline" href={`/data/teams/${team.id}`}>
                {team.name}
              </Link>
            </span>
          ),
        },
        { key: "short_name", header: "Short", render: (team) => team.short_name },
        { key: "country", header: "Country", render: (team) => team.country },
        {
          key: "tier",
          header: "Tier",
          align: "center",
          render: (team) => (
            <Badge variant={team.tier === 1 ? "primary" : team.tier === 2 ? "warning" : "default"}>
              {toRoman(team.tier)}
            </Badge>
          ),
        },
        {
          key: "reputation",
          header: "Reputation",
          align: "right",
          render: (team) => (team.reputation !== undefined ? team.reputation : "-"),
        },
      ]}
    />
  );
}
