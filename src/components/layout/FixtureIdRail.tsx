import { cn } from "@/lib/cn";

export type FixtureIdRailProps = {
  fixtureId: string;
  className?: string;
};

export function FixtureIdRail({ fixtureId, className }: FixtureIdRailProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted px-2 py-1.5",
        className,
      )}
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        Fixture ID
      </p>
      <p className="text-[11px] font-mono uppercase tracking-widest text-foreground">
        {fixtureId}
      </p>
    </div>
  );
}
