import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DataPage from "./page";

describe("/data", () => {
  it("renders the hero stat line and competition cards", async () => {
    render(await DataPage());

    expect(screen.getByText(/competitions/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /LEC/ })).toHaveAttribute("href", "/data/competitions/lec");
  });
});
