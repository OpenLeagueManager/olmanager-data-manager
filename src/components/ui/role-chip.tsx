import { cn } from "@/lib/cn";
import type { LoLRole } from "@/data/olmanager/types";

const ROLE_ICON_SRC: Record<LoLRole, string> = {
  Top: "/role-icons/top.webp",
  Jungle: "/role-icons/jungler.webp",
  Mid: "/role-icons/mid.webp",
  Adc: "/role-icons/adc.webp",
  Support: "/role-icons/support.webp",
};

const ROLE_LABEL: Record<LoLRole, string> = {
  Top: "Top",
  Jungle: "Jungle",
  Mid: "Mid",
  Adc: "ADC",
  Support: "Support",
};

export type RoleChipProps = {
  role: LoLRole | string;
  showLabel?: boolean;
  className?: string;
};

export function RoleChip({ role, showLabel = true, className }: RoleChipProps) {
  const normalized = normalizeRole(role);
  const src = normalized ? ROLE_ICON_SRC[normalized] : "/role-icons/allroles.webp";
  const label = normalized ? ROLE_LABEL[normalized] : role;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1 text-xs font-semibold",
        className,
      )}
      aria-label={label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden="true" className="size-4" src={src} />
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}

function normalizeRole(role: string): LoLRole | null {
  const match = Object.keys(ROLE_ICON_SRC).find(
    (key) => key.toLowerCase() === role.toLowerCase(),
  );
  return (match as LoLRole) ?? null;
}
