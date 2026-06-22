"use client";

import { cn } from "@/lib/cn";
import { useMemo, useState, type ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sort?: (a: T, b: T, dir: SortDirection) => number;
};

type SortState = { key: string; direction: SortDirection } | null;

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  caption?: string;
};

export function DataTable<T>({ columns, rows, empty, caption }: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sort) return rows;
    return [...rows].sort((a, b) => column.sort!(a, b, sort.direction));
  }, [rows, sort, columns]);

  const handleSort = (key: string) => {
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-sm text-muted-foreground">{empty ?? "No data."}</div>
    );
  }

  const getAriaSort = (columnKey: string) => {
    if (sort?.key !== columnKey) return undefined;
    return sort.direction === "asc" ? ("ascending" as const) : ("descending" as const);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="sticky top-0 bg-muted">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                aria-sort={getAriaSort(column.key)}
                className={cn(
                  "px-4 py-3 text-left font-medium",
                  column.sortable && "cursor-pointer select-none hover:bg-muted-foreground/10",
                  column.align === "right" && "text-right",
                  column.align === "center" && "text-center",
                )}
                onClick={() => handleSort(column.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortable && sort?.key === column.key && (
                    <span aria-hidden="true" className="text-xs">
                      {sort.direction === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/50">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-4 py-3 tabular-nums",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
