import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataTable } from "./data-table";

type Item = { id: string; name: string; count: number };

const columns = [
  {
    key: "name",
    header: "Name",
    render: (row: Item) => row.name,
    sortable: true,
    sort: (a: Item, b: Item, dir: "asc" | "desc") => {
      const cmp = a.name.localeCompare(b.name);
      return dir === "asc" ? cmp : -cmp;
    },
  },
  {
    key: "count",
    header: "Count",
    align: "right" as const,
    render: (row: Item) => row.count,
    sortable: true,
    sort: (a: Item, b: Item, dir: "asc" | "desc") => {
      return dir === "asc" ? a.count - b.count : b.count - a.count;
    },
  },
];

const rows: Item[] = [
  { id: "a", name: "Charlie", count: 3 },
  { id: "b", name: "Alice", count: 1 },
  { id: "c", name: "Bob", count: 2 },
];

describe("DataTable", () => {
  it("renders rows", () => {
    render(
      <DataTable
        columns={[{ key: "name", header: "Name", render: (row: Item) => row.name }]}
        rows={[{ id: "x", name: "Alice", count: 0 }, { id: "y", name: "Bob", count: 0 }]}
      />,
    );

    expect(screen.getByRole("cell", { name: "Alice" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bob" })).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<DataTable columns={[]} rows={[]} empty="Nothing here." />);

    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("sorts ascending by name on first click", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);

    fireEvent.click(screen.getByText("Name"));

    const cells = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie)$/.test(c.textContent ?? ""));
    expect(cells[0]).toHaveTextContent("Alice");
    expect(cells[1]).toHaveTextContent("Bob");
    expect(cells[2]).toHaveTextContent("Charlie");
  });

  it("sorts descending on second click and clears on third", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);

    const nameHeader = screen.getByText("Name");

    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc

    const cells = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie)$/.test(c.textContent ?? ""));
    expect(cells[0]).toHaveTextContent("Charlie");
    expect(cells[1]).toHaveTextContent("Bob");
    expect(cells[2]).toHaveTextContent("Alice");

    fireEvent.click(nameHeader); // clear sort
    // Should return to original order
    const cleared = screen.getAllByRole("cell").filter((c) => /^(Alice|Bob|Charlie)$/.test(c.textContent ?? ""));
    expect(cleared[0]).toHaveTextContent("Charlie"); // original row 0
    expect(cleared[1]).toHaveTextContent("Alice");    // original row 1
    expect(cleared[2]).toHaveTextContent("Bob");      // original row 2
  });

  it("sorts by count numerically", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);

    fireEvent.click(screen.getByText("Count"));

    const countCells = screen
      .getAllByRole("cell")
      .filter((c) => ["1", "2", "3"].includes(c.textContent ?? ""));
    expect(countCells[0]).toHaveTextContent("1");
    expect(countCells[1]).toHaveTextContent("2");
    expect(countCells[2]).toHaveTextContent("3");
  });

  it("sets aria-sort on sorted column", () => {
    render(<DataTable columns={columns} rows={rows} caption="Items" />);

    fireEvent.click(screen.getByText("Name"));

    const header = screen.getByRole("columnheader", { name: /Name/ });
    expect(header).toHaveAttribute("aria-sort", "ascending");
  });
});
