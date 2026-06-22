"use client";

import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { RoleChip } from "@/components/ui/role-chip";
import type { Player } from "@/data/olmanager/types";

type PlayerRow = Player & { teamName: string; teamId: string };

export function PlayersTable({ players }: { players: PlayerRow[] }) {
  return (
    <DataTable
      rows={players}
      caption="All players"
      empty="No players found."
      columns={[
        {
          key: "name",
          header: "Name",
          render: (player) => (
            <Link className="font-medium hover:underline" href={`/data/players/${player.id}`}>
              {player.match_name}
            </Link>
          ),
        },
        { key: "full_name", header: "Full name", render: (player) => player.full_name },
        {
          key: "team",
          header: "Team",
          render: (player) =>
            player.teamId ? (
              <Link className="hover:underline" href={`/data/teams/${player.teamId}`}>
                {player.teamName}
              </Link>
            ) : (
              player.team_id
            ),
        },
        { key: "role", header: "Role", render: (player) => <RoleChip role={player.position} /> },
        { key: "nationality", header: "Nationality", render: (player) => player.nationality },
        {
          key: "wage",
          header: "Wage",
          align: "right",
          render: (player) => player.wage.toLocaleString(),
        },
      ]}
    />
  );
}
