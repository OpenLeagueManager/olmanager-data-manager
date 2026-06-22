import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the landing title and eyebrow", () => {
    render(<Home />);

    expect(screen.getByText("OLManager Data Manager")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: /Review data changes before anything ships/i }),
    ).toBeVisible();
  });

  it("exposes the proposal workbench link", () => {
    render(<Home />);

    const workbenchLink = screen.getByRole("link", { name: /Open proposal workbench/i });
    expect(workbenchLink).toBeVisible();
    expect(workbenchLink).toHaveAttribute("href", "/proposals");
  });

  it("exposes the create-first-proposal link", () => {
    render(<Home />);

    const createLink = screen.getByRole("link", { name: /Create first proposal/i });
    expect(createLink).toBeVisible();
    expect(createLink).toHaveAttribute("href", "/proposals/new/AddPlayer");
  });

  it("shows the production status badge", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /GitHub-backed/i })).toBeVisible();
    expect(screen.getByText("Production")).toBeVisible();
    expect(
      screen.getByText(/Proposals are created as GitHub Issues/i),
    ).toBeVisible();
  });
});
