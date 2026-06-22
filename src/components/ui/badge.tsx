import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type BadgeProps = {
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  children: ReactNode;
  className?: string;
};

export function Badge({
  variant = "default",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        {
          "border-border bg-background text-foreground": variant === "default",
          "border-primary/20 bg-primary/10 text-primary": variant === "primary",
          "border-emerald-200 bg-emerald-50 text-emerald-700": variant === "success",
          "border-amber-200 bg-amber-50 text-amber-700": variant === "warning",
          "border-red-200 bg-red-50 text-red-700": variant === "danger",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
