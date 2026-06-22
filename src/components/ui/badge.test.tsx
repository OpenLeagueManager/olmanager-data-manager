import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children as a visible status badge", () => {
    render(<Badge>draft</Badge>);

    const badge = screen.getByText("draft");
    expect(badge).toBeVisible();
    expect(badge.tagName.toLowerCase()).toBe("span");
  });

  it.each([
    ["default", "default"],
    ["primary", "primary"],
    ["success", "success"],
    ["warning", "warning"],
    ["danger", "danger"],
  ] as const)("renders the %s variant", (variant, label) => {
    render(<Badge variant={variant}>{label}</Badge>);

    expect(screen.getByText(label)).toBeVisible();
  });

  it("forwards additional class names", () => {
    render(<Badge className="extra-class">labeled</Badge>);

    expect(screen.getByText("labeled")).toHaveClass("extra-class");
  });
});
