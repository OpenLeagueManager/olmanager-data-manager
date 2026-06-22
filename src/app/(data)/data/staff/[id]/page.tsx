import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getCompetition } from "@/lib/data/competitions";
import { getStaff } from "@/lib/data/staffs";
import { getTeam } from "@/lib/data/teams";

export default async function StaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = getStaff(id);
  if (!staff) notFound();

  const team = getTeam(staff.team_id);
  const competition = getCompetition(team?.id.split("-")[0] ?? "");

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          {
            label: competition?.name ?? "Competition",
            href: competition ? `/data/competitions/${competition.id}` : "/data/competitions",
          },
          {
            label: team?.name ?? "Team",
            href: team ? `/data/teams/${team.id}` : "/data/teams",
          },
          { label: staff.first_name, href: `/data/staff/${id}` },
        ]}
      />

      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {staff.first_name} {staff.last_name}
        </h1>
        <p className="text-muted-foreground">
          {staff.role} · {staff.nationality ?? "-"} · Wage{" "}
          {typeof staff.wage === "number" ? staff.wage.toLocaleString() : "-"}
        </p>
      </section>

      {staff.attributes ? (
        <section className="grid gap-3">
          <h2 className="font-heading text-2xl font-medium">Attributes</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(staff.attributes).map(([key, value]) => (
              <div key={key} className="rounded-md border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="font-heading text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="primary">
          <Link href={`/proposals/new/EditStaff?entityId=${encodeURIComponent(id)}`}>Propose change</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href={`/proposals/new/ReleaseStaff?entityId=${encodeURIComponent(id)}`}>Propose release</Link>
        </Button>
      </div>
    </div>
  );
}
