import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
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
            href: competition ? `/data/competitions/${competition.id}` : "/data",
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
    </div>
  );
}
