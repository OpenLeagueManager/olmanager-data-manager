import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import TeamPage from "./page";

describe("/data/teams/[id]", () => {
  it("renders the team roster with player links", async () => {
    render(await TeamPage({ params: Promise.resolve({ id: "lec-g2-esports" }) }));

    expect(screen.getByRole("heading", { name: "G2 Esports" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Caps" })).toHaveAttribute("href", "/data/players/lec-player-98767975968177297");
  });
});
