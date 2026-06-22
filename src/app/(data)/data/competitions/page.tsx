import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { listCompetitions, toRoman } from "@/lib/data/competitions";

export default async function CompetitionsIndexPage() {
  const competitions = listCompetitions();

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: "Competitions", href: "/data/competitions" },
        ]}
      />
      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Competitions</h1>
        <p className="text-muted-foreground">{competitions.length} competitions</p>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => (
          <Link key={competition.id} href={`/data/competitions/${competition.id}`} className="group focus-visible:outline-none">
            <Card className="h-full transition-shadow motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md">
              <CardContent className="grid gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-heading text-xl font-medium">{competition.name}</h2>
                  <Badge variant="primary">{toRoman(competition.tier)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{competition.full_name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
