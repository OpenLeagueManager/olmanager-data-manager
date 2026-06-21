"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FixtureIdRail } from "./FixtureIdRail";

export type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  href: string;
  label: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/proposals", label: "Proposal workbench" },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="primary-sidebar"
        className={cn(
          "fixed z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:static",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Primary navigation"
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4 font-heading text-lg font-semibold text-sidebar-primary">
          OLManager Data
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 scrollbar-v2">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                onClick={onClose}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <FixtureIdRail fixtureId="OLM-DATA-V2" />
        </div>
      </aside>
    </>
  );
}
