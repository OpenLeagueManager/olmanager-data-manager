import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { getCompetition } from "@/lib/data/competitions";
import { getRoster } from "@/lib/data/players";
import { getTeam } from "@/lib/data/teams";
import { RosterTable } from "./roster-table";

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = getTeam(id);
  if (!team) notFound();

  const roster = getRoster(id);
  const competition = getCompetition(id.split("-")[0] ?? "");

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          {
            label: competition?.name ?? "Competition",
            href: competition ? `/data/competitions/${competition.id}` : "/data/competitions",
          },
          { label: team.name, href: `/data/teams/${id}` },
        ]}
      />

      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{team.name}</h1>
        <p className="text-muted-foreground">
          {team.short_name} · {team.country} · Wage budget {team.wage_budget?.toLocaleString() ?? "-"}
        </p>
      </section>

      <RosterTable teamName={team.name} players={roster.players} staff={roster.staff} />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary">
          <Link href={`/proposals/new/EditTeam?entityId=${encodeURIComponent(id)}`}>Propose change</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/proposals/new/RemoveTeam?entityId=${encodeURIComponent(id)}`}>Propose remove</Link>
        </Button>
      </div>
    </div>
  );
}
