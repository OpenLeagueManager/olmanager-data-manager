"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { toRoman } from "@/lib/data/to-roman";
import type { Team } from "@/data/olmanager/types";

type TeamRow = Team & { competitionName: string; competitionId: string };

export function TeamsTable({ teams }: { teams: TeamRow[] }) {
  return (
    <DataTable
      rows={teams}
      caption="All teams"
      empty="No teams found."
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
        {
          key: "competition",
          header: "Competition",
          render: (team) =>
            team.competitionId ? (
              <Link className="hover:underline" href={`/data/competitions/${team.competitionId}`}>
                {team.competitionName}
              </Link>
            ) : (
              "-"
            ),
        },
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
      ]}
    />
  );
}
