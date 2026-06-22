import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProposalsLayout from "./layout";

vi.mock("next/navigation", () => ({
  usePathname: () => "/proposals",
}));

describe("ProposalsLayout", () => {
  it("wraps children in the shell with sidebar, topbar, and main content", () => {
    render(
      <ProposalsLayout>
        <div data-testid="proposal-page-content">Proposal page content</div>
      </ProposalsLayout>,
    );

    expect(screen.getByLabelText("Primary navigation")).toBeVisible();
    expect(screen.getByText("OLManager Data")).toBeVisible();
    expect(screen.getByRole("banner")).toBeVisible();
    expect(screen.getByRole("button", { name: "Toggle navigation" })).toBeVisible();

    const pageContent = screen.getByTestId("proposal-page-content");
    expect(pageContent).toBeVisible();
    expect(pageContent.closest("main")).toBeInTheDocument();
    expect(pageContent).toHaveTextContent("Proposal page content");
  });

  it("renders primary navigation links inside the sidebar", () => {
    render(
      <ProposalsLayout>
        <div>Child</div>
      </ProposalsLayout>,
    );

    const nav = screen.getByLabelText("Primary navigation");
    expect(nav).toBeVisible();
    expect(nav).toContainElement(screen.getByRole("link", { name: "Home" }));
    expect(nav).toContainElement(screen.getByRole("link", { name: "Proposal workbench" }));
  });
});
