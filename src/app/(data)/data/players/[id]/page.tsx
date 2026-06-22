import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { calculateLolOvr } from "@/data/olmanager/rating";
import { RoleChip } from "@/components/ui/role-chip";
import { getCompetition } from "@/lib/data/competitions";
import { getPlayer } from "@/lib/data/players";
import { getTeam } from "@/lib/data/teams";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = getPlayer(id);
  if (!player) notFound();

  const team = getTeam(player.team_id);
  const competition = getCompetition(team?.id.split("-")[0] ?? "");

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          {
            label: competition?.name ?? "Competition",
            href: competition ? `/data/competitions/${competition.id}` : "/data",
          },
          {
            label: team?.name ?? "Team",
            href: team ? `/data/teams/${team.id}` : "/data",
          },
          { label: player.match_name, href: `/data/players/${id}` },
        ]}
      />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">{player.full_name}</h1>
          <RoleChip role={player.position} />
        </div>
        <p className="text-muted-foreground">
          {player.match_name} · {player.nationality} · Wage {player.wage.toLocaleString()}
        </p>
      </section>

      {player.natural_position && player.natural_position !== player.position ? (
        <section className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm">
            <span className="font-medium text-amber-400">Position mismatch:</span>{" "}
            Current role is <RoleChip role={player.position} /> but natural position is{" "}
            <RoleChip role={player.natural_position} />.
          </p>
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="font-heading text-2xl font-medium">Details</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Position</p>
            <p className="font-heading text-lg font-semibold">{player.position}</p>
          </div>
          {player.natural_position ? (
            <div className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Natural pos.</p>
              <p className="font-heading text-lg font-semibold">{player.natural_position}</p>
            </div>
          ) : null}
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Market value</p>
            <p className="font-heading text-lg font-semibold">{player.market_value.toLocaleString()}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Date of birth</p>
            <p className="font-heading text-lg font-semibold">{player.date_of_birth || "-"}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Contract end</p>
            <p className="font-heading text-lg font-semibold">{player.contract_end || "-"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-2xl font-medium">Attributes</h2>
          <p className="text-sm text-muted-foreground">
            Computed OVR: <Badge variant="primary">{calculateLolOvr(player.attributes)}</Badge>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Object.entries(player.attributes).map(([key, value]) => (
            <div key={key} className="rounded-md border border-border p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {key.replace(/_/g, " ")}
              </p>
              <p className="font-heading text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <Button asChild variant="primary">
        <Link href={`/proposals/new/EditPlayer?entityId=${encodeURIComponent(id)}`}>Propose change</Link>
      </Button>
    </div>
  );
}
