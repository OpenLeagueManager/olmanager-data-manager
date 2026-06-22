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
          "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary": variant === "primary",
          "border-success bg-success text-success-foreground dark:border-success dark:bg-success dark:text-success-foreground": variant === "success",
          "border-warning bg-warning text-warning-foreground dark:border-warning dark:bg-warning dark:text-warning-foreground": variant === "warning",
          "border-destructive bg-destructive text-destructive-foreground dark:border-destructive dark:bg-destructive dark:text-destructive-foreground": variant === "danger",
        },
        className,
      )}
    >
      {children}
    </span>
  );
}
