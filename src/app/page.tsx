import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PROPOSAL_TYPE_METADATA } from "@/domain/proposals/metadata";

export default function Home() {
  return (
    <main className="mx-auto grid max-w-3xl gap-6 p-4 md:p-6">
      <section className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          OLManager Data Manager
        </p>
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Review data changes before anything ships.
        </h1>
        <p className="text-lg text-muted-foreground">
          Contributors create typed proposals from canonical LoL data. Reviewers inspect
          deterministic diffs and record stub approval or rejection decisions in this
          browser session only.
        </p>
      </section>

      <Card>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <h2 className="font-heading text-xl font-medium">Open the workbench</h2>
            <p className="text-sm text-muted-foreground">
              Create canonical-data-backed proposals, inspect deterministic diffs, and
              record stub reviewer decisions without writing to Discord, GitHub,
              production storage, assets, or ZIP exports.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <Link href="/proposals">Open proposal workbench</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={PROPOSAL_TYPE_METADATA.AddPlayer.href}>
                Create first proposal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-xl font-medium">MVP boundary</h2>
            <Badge variant="primary">Session-only</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a safe review loop, not a production pipeline. Proposals stay
            session-backed; no production integrations run on approval.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
