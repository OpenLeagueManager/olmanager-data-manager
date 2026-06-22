"use client";

import Link from "next/link";
import { DataTable, type Column, type SortDirection } from "@/components/ui/data-table";
import { formatNumber } from "@/lib/format-number";
import type { Staff } from "@/lib/olmanager/types";

type StaffRow = Staff & { teamName: string; teamId: string };

function stringSort(keyFn: (row: StaffRow) => string) {
  return (a: StaffRow, b: StaffRow, dir: SortDirection) => {
    const cmp = keyFn(a).localeCompare(keyFn(b));
    return dir === "asc" ? cmp : -cmp;
  };
}

function numberSort(keyFn: (row: StaffRow) => number) {
  return (a: StaffRow, b: StaffRow, dir: SortDirection) => {
    return dir === "asc" ? keyFn(a) - keyFn(b) : keyFn(b) - keyFn(a);
  };
}

export function StaffTable({ staff }: { staff: StaffRow[] }) {
  const columns: Column<StaffRow>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sort: stringSort((s) => `${s.first_name} ${s.last_name ?? ""}`),
      getSearchValue: (s) => `${s.first_name} ${s.last_name ?? ""}`,
      render: (member) => (
        <Link className="font-medium hover:underline" href={`/data/staff/${member.id}`}>
          {member.first_name} {member.last_name}
        </Link>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      sort: stringSort((s) => s.role),
      filterable: true,
      getSearchValue: (s) => s.role,
      render: (member) => member.role,
    },
    {
      key: "team",
      header: "Team",
      getSearchValue: (s) => s.teamName,
      render: (member) =>
        member.teamId ? (
          <Link className="hover:underline" href={`/data/teams/${member.teamId}`}>
            {member.teamName}
          </Link>
        ) : (
          member.team_id
        ),
    },
    {
      key: "wage",
      header: "Wage",
      align: "right",
      sortable: true,
      sort: numberSort((s) => (typeof s.wage === "number" ? s.wage : 0)),
      render: (member) => (typeof member.wage === "number" ? formatNumber(member.wage) : "-"),
    },
  ];

  return (
    <DataTable
      rows={staff}
      columns={columns}
      caption="All staff"
      empty="No staff found."
      searchable
      searchPlaceholder="Search by name, role, or team..."
    />
  );
}
