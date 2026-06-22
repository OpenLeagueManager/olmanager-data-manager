"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column, type SortDirection } from "@/components/ui/data-table";
import { toRoman } from "@/lib/data/to-roman";
import type { Team } from "@/lib/olmanager/types";

type TeamRow = Team & { competitionName: string; competitionId: string };

function stringSort(keyFn: (row: TeamRow) => string) {
  return (a: TeamRow, b: TeamRow, dir: SortDirection) => {
    const cmp = keyFn(a).localeCompare(keyFn(b));
    return dir === "asc" ? cmp : -cmp;
  };
}

function numberSort(keyFn: (row: TeamRow) => number) {
  return (a: TeamRow, b: TeamRow, dir: SortDirection) => {
    return dir === "asc" ? keyFn(a) - keyFn(b) : keyFn(b) - keyFn(a);
  };
}

export function TeamsTable({ teams }: { teams: TeamRow[] }) {
  const columns: Column<TeamRow>[] = [
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
      key: "competition",
      header: "Competition",
      filterable: true,
      getFilterValue: (t) => t.competitionName,
      getSearchValue: (t) => t.competitionName,
      render: (team) =>
        team.competitionId ? (
          <Link className="hover:underline" href={`/data/competitions/${team.competitionId}`}>
            {team.competitionName}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      key: "country",
      header: "Country",
      filterable: true,
      sortable: true,
      sort: stringSort((t) => t.country ?? ""),
      render: (team) => team.country || "-",
    },
    {
      key: "tier",
      header: "Tier",
      align: "center",
      filterable: true,
      sortable: true,
      sort: numberSort((t) => t.tier),
      render: (team) => (
        <Badge variant={team.tier === 1 ? "primary" : team.tier === 2 ? "warning" : "default"}>
          {toRoman(team.tier)}
        </Badge>
      ),
    },
  ];

  return (
    <DataTable
      rows={teams}
      columns={columns}
      caption="All teams"
      empty="No teams found."
      searchable
      searchPlaceholder="Search by name or competition..."
    />
  );
}
