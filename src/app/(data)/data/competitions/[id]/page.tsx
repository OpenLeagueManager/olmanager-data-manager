import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { getCompetition, toRoman } from "@/lib/data/competitions";
import { getTeamsByCompetition } from "@/lib/data/teams";
import { CompetitionTeamsTable } from "./competition-teams-table";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
};

const PAGE_SIZE = 25;

export default async function CompetitionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { page } = await searchParams;
  const competition = getCompetition(id);
  if (!competition) notFound();

  const teams = getTeamsByCompetition(id);
  const currentPage = Math.max(1, Number(page) || 1);
  const totalPages = Math.max(1, Math.ceil(teams.length / PAGE_SIZE));
  const pageTeams = teams.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: competition.name, href: `/data/competitions/${id}` },
        ]}
      />

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">{competition.name}</h1>
          <Badge variant="primary">{toRoman(competition.tier)}</Badge>
        </div>
        <p className="text-muted-foreground">
          {competition.full_name} · {teams.length} teams
        </p>
      </section>

      <CompetitionTeamsTable teams={pageTeams} competitionName={competition.name} />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {currentPage > 1 ? (
              <Link
                className="rounded-md border border-border px-3 py-1 hover:bg-muted"
                href={`/data/competitions/${id}?page=${currentPage - 1}`}
              >
                Previous
              </Link>
            ) : null}
            {currentPage < totalPages ? (
              <Link
                className="rounded-md border border-border px-3 py-1 hover:bg-muted"
                href={`/data/competitions/${id}?page=${currentPage + 1}`}
              >
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary">
          <Link href={`/proposals/new/EditCompetition?entityId=${encodeURIComponent(id)}`}>Propose change</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/proposals/new/RemoveCompetition?entityId=${encodeURIComponent(id)}`}>Propose remove</Link>
        </Button>
      </div>
    </div>
  );
}
