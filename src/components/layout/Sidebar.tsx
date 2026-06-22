"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { FixtureIdRail } from "./FixtureIdRail";

export type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

type NavLink = { href: string; label: string };
type NavSection = { id: string; label: string; links: NavLink[] };

const NAV_SECTIONS: NavSection[] = [
  { id: "home", label: "Home", links: [{ href: "/", label: "Home" }] },
  {
    id: "browse",
    label: "Browse",
    links: [
      { href: "/data", label: "Data home" },
      { href: "/data/competitions", label: "Competitions" },
      { href: "/data/teams", label: "Teams" },
      { href: "/data/players", label: "Players" },
      { href: "/data/staff", label: "Staff" },
    ],
  },
  {
    id: "workbench",
    label: "Workbench",
    links: [{ href: "/proposals", label: "Proposal workbench" }],
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ browse: true });

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
          {NAV_SECTIONS.map((section) => {
            const isBrowse = section.id === "browse";
            return (
              <div key={section.id}>
                {isBrowse ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, browse: !prev.browse }))
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith("/data")
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    aria-expanded={expanded.browse}
                    aria-controls={`browse-links`}
                  >
                    {section.label}
                    <span aria-hidden="true">{expanded.browse ? "−" : "+"}</span>
                  </button>
                ) : null}
                <div
                  id={`${section.id}-links`}
                  className={cn("space-y-1", isBrowse && !expanded.browse && "hidden", isBrowse && "mt-1 pl-2")}
                >
                  {section.links.map((item) => {
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
                </div>
              </div>
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
