import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CompetitionPage from "./page";

describe("/data/competitions/[id]", () => {
  it("renders a paginated team table", async () => {
    render(await CompetitionPage({ params: Promise.resolve({ id: "lec" }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: "LEC" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "G2 Esports" })).toHaveAttribute("href", "/data/teams/lec-g2-esports");
  });
});
