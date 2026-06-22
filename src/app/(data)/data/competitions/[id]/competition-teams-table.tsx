"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column, type SortDirection } from "@/components/ui/data-table";
import { toRoman } from "@/lib/data/to-roman";
import type { Team } from "@/lib/olmanager/types";

function stringSort(keyFn: (row: Team) => string) {
  return (a: Team, b: Team, dir: SortDirection) => {
    const cmp = keyFn(a).localeCompare(keyFn(b));
    return dir === "asc" ? cmp : -cmp;
  };
}

export function CompetitionTeamsTable({
  teams,
  competitionName,
}: {
  teams: Team[];
  competitionName: string;
}) {
  const columns: Column<Team>[] = [
    {
      key: "name",
      header: "Team",
      sortable: true,
      sort: stringSort((t) => t.name),
      getSearchValue: (t) => t.name,
      render: (team) => (
        <span className="border-l-4 pl-2" style={{ borderColor: team.colors?.primary ?? "#888888" }}>
          <Link className="font-medium hover:underline" href={`/data/teams/${team.id}`}>
            {team.name}
          </Link>
        </span>
      ),
    },
    {
      key: "short_name",
      header: "Short",
      sortable: true,
      sort: stringSort((t) => t.short_name),
      getSearchValue: (t) => t.short_name,
      render: (team) => team.short_name,
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
      sort: stringSort((t) => t.country ?? ""),
      render: (team) => team.country || "-",
    },
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
  ];

  return (
    <DataTable
      rows={teams}
      columns={columns}
      caption={`Teams in ${competitionName}`}
      empty="No teams in this competition."
      searchable
      searchPlaceholder="Search teams..."
    />
  );
}
