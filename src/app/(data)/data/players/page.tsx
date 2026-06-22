import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { listPlayers } from "@/lib/data/players";
import { getTeam } from "@/lib/data/teams";
import { PlayersTable } from "./players-table";

export default async function PlayersIndexPage() {
  const players = listPlayers();

  // Pre-compute team lookups server-side
  const enriched = players.map((player) => {
    const team = getTeam(player.team_id);
    return {
      ...player,
      teamName: team?.name ?? "",
      teamId: team?.id ?? "",
    };
  });

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: "Players", href: "/data/players" },
        ]}
      />
      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Players</h1>
        <p className="text-muted-foreground">{players.length} players</p>
      </section>
      <PlayersTable players={enriched} />
    </div>
  );
}
