import { cn } from "@/lib/cn";

export type FixtureIdRailProps = {
  fixtureId: string;
  className?: string;
};

export function FixtureIdRail({ fixtureId, className }: FixtureIdRailProps) {
  return (
    <div
      className={cn(
        "rounded-md bg-zinc-100 px-2 py-1.5 dark:bg-zinc-900",
        className,
      )}
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Fixture ID
      </p>
      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
        {fixtureId}
      </p>
    </div>
  );
}
