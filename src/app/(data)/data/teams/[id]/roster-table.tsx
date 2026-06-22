"use client";

import Link from "next/link";
import { DataTable, type Column, type SortDirection } from "@/components/ui/data-table";
import { RoleChip } from "@/components/ui/role-chip";
import type { Player, Staff } from "@/data/olmanager/types";

function isPlayer(row: Player | Staff): row is Player {
  return "match_name" in row;
}

function getName(row: Player | Staff): string {
  return isPlayer(row) ? row.match_name : `${row.first_name} ${row.last_name ?? ""}`;
}

function getRole(row: Player | Staff): string {
  return isPlayer(row) ? row.position : row.role;
}

function getNationality(row: Player | Staff): string {
  return isPlayer(row) ? row.nationality : row.nationality ?? "";
}

function getWage(row: Player | Staff): number {
  return typeof row.wage === "number" ? row.wage : 0;
}

function stringSort(keyFn: (row: Player | Staff) => string) {
  return (a: Player | Staff, b: Player | Staff, dir: SortDirection) => {
    const cmp = keyFn(a).localeCompare(keyFn(b));
    return dir === "asc" ? cmp : -cmp;
  };
}

function numberSort(keyFn: (row: Player | Staff) => number) {
  return (a: Player | Staff, b: Player | Staff, dir: SortDirection) => {
    return dir === "asc" ? keyFn(a) - keyFn(b) : keyFn(b) - keyFn(a);
  };
}

type Props = {
  teamName: string;
  players: Player[];
  staff: Staff[];
};

export function RosterTable({ teamName, players, staff }: Props) {
  const rosterRows: (Player | Staff)[] = [...players, ...staff];

  return (
    <section className="grid gap-3">
      <h2 className="font-heading text-2xl font-medium">Roster</h2>
      <DataTable
        rows={rosterRows}
        caption={`Roster for ${teamName}`}
        empty="No roster entries."
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            sort: stringSort(getName),
            render: (row) =>
              isPlayer(row) ? (
                <Link className="font-medium hover:underline" href={`/data/players/${row.id}`}>
                  {row.match_name}
                </Link>
              ) : (
                <Link className="font-medium hover:underline" href={`/data/staff/${row.id}`}>
                  {row.first_name} {row.last_name}
                </Link>
              ),
          } as Column<Player | Staff>,
          {
            key: "role",
            header: "Role",
            sortable: true,
            sort: stringSort(getRole),
            render: (row) =>
              isPlayer(row) ? <RoleChip role={row.position} /> : row.role,
          } as Column<Player | Staff>,
          {
            key: "nationality",
            header: "Nationality",
            sortable: true,
            sort: stringSort(getNationality),
            render: (row) => (isPlayer(row) ? row.nationality : row.nationality ?? "-"),
          } as Column<Player | Staff>,
          {
            key: "wage",
            header: "Wage",
            align: "right",
            sortable: true,
            sort: numberSort(getWage),
            render: (row) =>
              typeof row.wage === "number" ? row.wage.toLocaleString() : "-",
          } as Column<Player | Staff>,
        ]}
      />
    </section>
  );
}
