import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Shell } from "./Shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/proposals",
}));

describe("Shell mobile navigation", () => {
  it("starts with the sidebar closed and an accessible toggle", () => {
    render(<Shell>Content</Shell>);

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "primary-sidebar");
    expect(
      screen.queryByRole("button", { name: "Close navigation" }),
    ).not.toBeInTheDocument();
  });

  it("opens the sidebar when the toggle is clicked", () => {
    render(<Shell>Content</Shell>);

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
  });

  it("closes the sidebar when the overlay is clicked", () => {
    render(<Shell>Content</Shell>);

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Close navigation" }),
    ).not.toBeInTheDocument();
  });

  it("closes the sidebar when a navigation link is clicked", () => {
    render(<Shell>Content</Shell>);

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("link", { name: "Home" }));

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Close navigation" }),
    ).not.toBeInTheDocument();
  });

  it("closes the sidebar when the toggle is clicked a second time", () => {
    render(<Shell>Content</Shell>);

    const toggle = screen.getByRole("button", { name: "Toggle navigation" });
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Close navigation" }),
    ).not.toBeInTheDocument();
  });
});
