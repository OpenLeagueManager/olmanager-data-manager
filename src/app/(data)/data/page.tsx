import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listCompetitions, toRoman } from "@/lib/data/competitions";
import { listPlayers, listStaffs, listTeams } from "@/lib/data";

export default async function DataPage() {
  const competitions = listCompetitions();
  const teams = listTeams();
  const players = listPlayers();
  const staff = listStaffs();

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Data explorer</p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Browse OLManager data
        </h1>
        <p className="text-muted-foreground">
          {competitions.length} competitions · {teams.length} teams · {players.length} players · {staff.length} staff
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => (
          <Link
            key={competition.id}
            href={`/data/competitions/${competition.id}`}
            className="group focus-visible:outline-none"
          >
            <Card className="h-full transition-shadow motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md">
              <CardContent className="grid gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-xl font-medium">{competition.name}</h2>
                  <Badge variant="primary">{toRoman(competition.tier)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{competition.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {competition.region} · {competition.country}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
