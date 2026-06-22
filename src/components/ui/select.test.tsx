import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

describe("Select", () => {
  it("renders options and a placeholder", () => {
    render(
      <Select
        options={[
          { value: "top", label: "Top" },
          { value: "jungle", label: "Jungle" },
        ]}
        placeholder="Pick a role"
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeVisible();
    expect(screen.getByRole("option", { name: "Pick a role" })).toBeDisabled();
    expect(screen.getByRole("option", { name: "Top" })).toHaveValue("top");
  });

  it("applies an error border", () => {
    render(<Select error="Required" options={[{ value: "a", label: "A" }]} />);
    expect(screen.getByRole("combobox")).toHaveClass("border-destructive");
  });
});
