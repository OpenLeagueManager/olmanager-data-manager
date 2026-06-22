"use client";

import Link from "next/link";
import { DataTable, type Column, type SortDirection } from "@/components/ui/data-table";
import { RoleChip } from "@/components/ui/role-chip";
import { formatNumber } from "@/lib/format-number";
import { calculateLolOvr } from "@/lib/olmanager/rating";
import type { Player } from "@/lib/olmanager/types";

type PlayerRow = Player & { teamName: string; teamId: string; ovr: number };

function stringSort(keyFn: (row: PlayerRow) => string) {
  return (a: PlayerRow, b: PlayerRow, dir: SortDirection) => {
    const cmp = keyFn(a).localeCompare(keyFn(b));
    return dir === "asc" ? cmp : -cmp;
  };
}

function numberSort(keyFn: (row: PlayerRow) => number) {
  return (a: PlayerRow, b: PlayerRow, dir: SortDirection) => {
    return dir === "asc" ? keyFn(a) - keyFn(b) : keyFn(b) - keyFn(a);
  };
}

export function PlayersTable({ players }: { players: PlayerRow[] }) {
  const columns: Column<PlayerRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sort: stringSort((p) => p.match_name),
      getSearchValue: (p) => p.match_name,
      render: (player) => (
        <Link className="font-medium hover:underline" href={`/data/players/${player.id}`}>
          {player.match_name}
        </Link>
      ),
    },
    {
      key: "full_name",
      header: "Full name",
      sortable: true,
      sort: stringSort((p) => p.full_name),
      getSearchValue: (p) => p.full_name,
      render: (player) => player.full_name,
    },
    {
      key: "team",
      header: "Team",
      getSearchValue: (p) => p.teamName,
      render: (player) =>
        player.teamId ? (
          <Link className="hover:underline" href={`/data/teams/${player.teamId}`}>
            {player.teamName}
          </Link>
        ) : (
          player.team_id
        ),
    },
    {
      key: "role",
      header: "Role",
      filterable: true,
      getFilterValue: (p) => p.position,
      render: (player) => <RoleChip role={player.position} />,
    },
    {
      key: "nationality",
      header: "Nationality",
      filterable: true,
      render: (player) => player.nationality,
    },
    {
      key: "ovr",
      header: "OVR",
      align: "center",
      sortable: true,
      sort: numberSort((p) => p.ovr),
      render: (player) => (
        <span className="font-mono font-semibold tabular-nums">{player.ovr}</span>
      ),
    },
    {
      key: "wage",
      header: "Wage",
      align: "right",
      sortable: true,
      sort: numberSort((p) => p.wage),
      render: (player) => formatNumber(player.wage),
    },
  ];

  return (
    <DataTable
      rows={players}
      columns={columns}
      caption="All players"
      empty="No players found."
      searchable
      searchPlaceholder="Search by name or team..."
    />
  );
}
