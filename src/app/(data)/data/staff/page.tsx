import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { listStaffs } from "@/lib/data/staffs";
import { getTeam } from "@/lib/data/teams";
import { StaffTable } from "./staff-table";

export default async function StaffIndexPage() {
  const staff = listStaffs();

  // Pre-compute team lookups server-side
  const enriched = staff.map((member) => {
    const team = getTeam(member.team_id);
    return {
      ...member,
      teamName: team?.name ?? "",
      teamId: team?.id ?? "",
    };
  });

  return (
    <div className="grid gap-6">
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: "Staff", href: "/data/staff" },
        ]}
      />
      <section className="grid gap-3">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">Staff</h1>
        <p className="text-muted-foreground">{staff.length} staff members</p>
      </section>
      <StaffTable staff={enriched} />
    </div>
  );
}
