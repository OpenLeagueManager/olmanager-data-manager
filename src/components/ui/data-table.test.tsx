import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable, type Column } from "./data-table";

type Item = { id: string; name: string; role: string; count: number };

const rows: Item[] = [
  { id: "a", name: "Charlie", role: "Mid", count: 3 },
  { id: "b", name: "Alice", role: "Top", count: 1 },
  { id: "c", name: "Bob", role: "Mid", count: 2 },
  { id: "d", name: "Diana", role: "Jungle", count: 5 },
];

const columns: Column<Item>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    sort: (a, b, dir) => (dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)),
    getSearchValue: (row) => row.name,
    render: (row) => row.name,
  },
  {
    key: "role",
    header: "Role",
    filterable: true,
    getFilterValue: (row) => row.role,
    getSearchValue: (row) => row.role,
    render: (row) => row.role,
  },
  {
    key: "count",
    header: "Count",
    align: "right" as const,
    sortable: true,
    sort: (a, b, dir) => (dir === "asc" ? a.count - b.count : b.count - a.count),
    render: (row) => row.count,
  },
];

describe("DataTable", () => {
  it("renders rows", () => {
    render(
      <DataTable
        columns={[{ key: "name", header: "Name", render: (r: Item) => r.name }]}
        rows={[{ id: "x", name: "Alice", role: "Top", count: 0 }]}
      />,
    );
    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<DataTable columns={[]} rows={[]} empty="Nothing here." />);
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("sorts ascending by name on first click", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);
    fireEvent.click(screen.getByText("Name"));
    const cells = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie|Diana)$/.test(c.textContent ?? ""));
    expect(cells[0]).toHaveTextContent("Alice");
    expect(cells[1]).toHaveTextContent("Bob");
    expect(cells[2]).toHaveTextContent("Charlie");
    expect(cells[3]).toHaveTextContent("Diana");
  });

  it("filters by role", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);
    const selects = screen.getAllByRole("combobox");
    const roleSelect = selects.find((s) => s.closest("th")?.textContent?.includes("Role"));
    expect(roleSelect).toBeDefined();

    fireEvent.change(roleSelect!, { target: { value: "Mid" } });
    const cells = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie|Diana)$/.test(c.textContent ?? ""));
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent("Charlie");
    expect(cells[1]).toHaveTextContent("Bob");
  });

  it("searches by text", () => {
    render(<DataTable columns={columns} rows={rows} searchable searchPlaceholder="Search..." />);
    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "ali" } });
    const cells = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie|Diana)$/.test(c.textContent ?? ""));
    expect(cells).toHaveLength(1);
    expect(cells[0]).toHaveTextContent("Alice");
  });

  it("shows no-results message when search has no match", () => {
    render(<DataTable columns={columns} rows={rows} searchable searchPlaceholder="Search..." />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "zzzzz" } });
    expect(screen.getByText("No results match your search or filters.")).toBeInTheDocument();
  });

  it("shows count badge when search is active", () => {
    render(<DataTable columns={columns} rows={rows} searchable searchPlaceholder="Search..." />);
    fireEvent.change(screen.getByPlaceholderText("Search..."), { target: { value: "mid" } });
    expect(screen.getByText("2 of 4")).toBeInTheDocument();
  });
});
