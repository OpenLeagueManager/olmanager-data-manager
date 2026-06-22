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
  /** Enable a dropdown filter for this column. Options are auto-extracted from data unless provided. */
  filterable?: boolean;
  /** Predefined filter options. If omitted, unique values are extracted from rows. */
  filterOptions?: string[];
  /** Extract the string value used for filtering this column. Defaults to a simple property access. */
  getFilterValue?: (row: T) => string;
  /** Extract a string value for the global search. If omitted, the column is not searchable. */
  getSearchValue?: (row: T) => string;
};

type SortState = { key: string; direction: SortDirection } | null;

export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  caption?: string;
  /** Show a global text search input above the table. */
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function DataTable<T>({ columns, rows, empty, caption, searchable, searchPlaceholder }: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Auto-extract filter options for filterable columns
  const filterOptionsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      if (!col.filterable) continue;
      if (col.filterOptions) {
        map[col.key] = col.filterOptions;
      } else {
        const getValue = col.getFilterValue ?? ((row: T) => String((row as Record<string, unknown>)[col.key] ?? ""));
        const unique = [...new Set(rows.map(getValue).filter(Boolean))].sort();
        map[col.key] = unique;
      }
    }
    return map;
  }, [columns, rows]);

  // Pipeline: filter → search → sort
  const processedRows = useMemo(() => {
    let result = rows;

    // Apply column filters
    const activeFilters = Object.entries(filters).filter(([, v]) => v !== "");
    if (activeFilters.length > 0) {
      result = result.filter((row) =>
        activeFilters.every(([key, value]) => {
          const col = columns.find((c) => c.key === key);
          const getValue = col?.getFilterValue ?? ((r: T) => String((r as Record<string, unknown>)[key] ?? ""));
          return getValue(row) === value;
        }),
      );
    }

    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      const searchableCols = columns.filter((c) => c.getSearchValue);
      result = result.filter((row) =>
        searchableCols.some((col) => col.getSearchValue!(row).toLowerCase().includes(q)),
      );
    }

    // Apply sort
    if (sort) {
      const column = columns.find((c) => c.key === sort.key);
      if (column?.sort) {
        result = [...result].sort((a, b) => column.sort!(a, b, sort.direction));
      }
    }

    return result;
  }, [rows, filters, search, sort, columns]);

  const handleSort = (key: string) => {
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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
    <div className="grid gap-3">
      {searchable ? (
        <div className="flex items-center gap-2">
          <input
            className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder ?? "Search..."}
            type="search"
            value={search}
          />
          {search ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {processedRows.length} of {rows.length}
            </span>
          ) : null}
        </div>
      ) : null}

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
                    "px-4 py-3 text-left font-medium text-foreground",
                    column.sortable && "cursor-pointer select-none hover:bg-muted-foreground/10",
                    column.align === "right" && "text-right",
                    column.align === "center" && "text-center",
                  )}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="grid gap-1">
                    <span className="inline-flex items-center gap-1">
                      {column.header}
                      {column.sortable && sort?.key === column.key && (
                        <span aria-hidden="true" className="text-xs">
                          {sort.direction === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                    {column.filterable && filterOptionsMap[column.key]?.length ? (
                      <select
                        className="h-7 w-full rounded border border-input bg-background px-1 text-xs font-normal"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleFilter(column.key, e.target.value)}
                        value={filters[column.key] ?? ""}
                      >
                        <option value="">All</option>
                        {filterOptionsMap[column.key].map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {processedRows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={columns.length}>
                  No results match your search or filters.
                </td>
              </tr>
            ) : (
              processedRows.map((row, rowIndex) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
