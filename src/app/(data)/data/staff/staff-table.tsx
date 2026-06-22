"use client";

import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import type { Staff } from "@/data/olmanager/types";

type StaffRow = Staff & { teamName: string; teamId: string };

export function StaffTable({ staff }: { staff: StaffRow[] }) {
  return (
    <DataTable
      rows={staff}
      caption="All staff"
      empty="No staff found."
      columns={[
        {
          key: "name",
          header: "Name",
          render: (member) => (
            <Link className="font-medium hover:underline" href={`/data/staff/${member.id}`}>
              {member.first_name} {member.last_name}
            </Link>
          ),
        },
        { key: "role", header: "Role", render: (member) => member.role },
        {
          key: "team",
          header: "Team",
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
          render: (member) => (typeof member.wage === "number" ? member.wage.toLocaleString() : "-"),
        },
      ]}
    />
  );
}
