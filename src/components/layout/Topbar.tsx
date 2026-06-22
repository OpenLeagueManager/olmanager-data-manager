"use client";

import { cn } from "@/lib/cn";
import { ThemeToggle } from "./ThemeToggle";
import { AuthButton } from "./AuthButton";

export type TopbarProps = {
  onMenuClick: () => void;
  menuOpen?: boolean;
  className?: string;
};

export function Topbar({ onMenuClick, menuOpen = false, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex h-14 items-center justify-between border-b border-border bg-background/60 px-4 backdrop-blur",
        className,
      )}
    >
      <button
        type="button"
        aria-controls="primary-sidebar"
        aria-expanded={menuOpen}
        aria-label="Toggle navigation"
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        onClick={onMenuClick}
      >
        <MenuIcon className="size-5" />
      </button>

      <span className="font-heading text-sm font-medium text-foreground">
        OLManager Data Manager
      </span>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <AuthButton />
      </div>
    </header>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h16" />
    </svg>
  );
}
