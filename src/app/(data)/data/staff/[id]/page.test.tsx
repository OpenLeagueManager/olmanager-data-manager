import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StaffPage from "./page";

describe("/data/staff/[id]", () => {
  it("renders staff details and propose-change deep links", async () => {
    render(await StaffPage({ params: Promise.resolve({ id: "staff-e0e79a66" }) }));

    expect(screen.getByRole("heading", { name: "Tomás Campelos Fernández" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Propose change" })).toHaveAttribute(
      "href",
      "/proposals/new/EditStaff?entityId=staff-e0e79a66",
    );
    expect(screen.getByRole("link", { name: "Propose release" })).toHaveAttribute(
      "href",
      "/proposals/new/ReleaseStaff?entityId=staff-e0e79a66",
    );
  });
});
