import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlayerPage from "./page";

describe("/data/players/[id]", () => {
  it("renders player details and a propose-change deep link", async () => {
    render(await PlayerPage({ params: Promise.resolve({ id: "lec-player-98767975968177297" }) }));

    expect(screen.getByRole("heading", { name: "Rasmus Winther" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Propose change" })).toHaveAttribute(
      "href",
      "/proposals/new/EditPlayer?entityId=lec-player-98767975968177297",
    );
  });
});
