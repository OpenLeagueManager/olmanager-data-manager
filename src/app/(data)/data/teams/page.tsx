import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCompetition } from "@/lib/data/competitions";
import { listTeams } from "@/lib/data/teams";
import { TeamsTable } from "./teams-table";

export default async function TeamsIndexPage() {
  const teams = listTeams();

  // Pre-compute competition lookups server-side
  const enriched = teams.map((team) => {
    const competitionId = team.id.split("-")[0] ?? "";
    const competition = getCompetition(competitionId);
    return {
      ...team,
      competitionName: competition?.name ?? "",
      competitionId: competition?.id ?? "",
    };
  });

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: "Teams", href: "/data/teams" },
        ]}
      />
      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">{teams.length} teams</p>
      </section>
      <TeamsTable teams={enriched} />
    </div>
  );
}
