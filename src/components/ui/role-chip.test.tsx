import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleChip } from "./role-chip";

describe("RoleChip", () => {
  it.each([
    ["Top", "/role-icons/top.webp"],
    ["Jungle", "/role-icons/jungler.webp"],
    ["Mid", "/role-icons/mid.webp"],
    ["Adc", "/role-icons/adc.webp"],
    ["Support", "/role-icons/support.webp"],
  ] as const)("renders the %s role icon", (role, expectedSrc) => {
    render(<RoleChip role={role} />);

    const img = document.querySelector('img');
    expect(img).toHaveAttribute("src", expectedSrc);
    expect(screen.getByLabelText(role === "Adc" ? "ADC" : role)).toBeVisible();
  });

  it("falls back to the all-roles icon for unknown roles", () => {
    render(<RoleChip role="Unknown" />);

    expect(document.querySelector('img')).toHaveAttribute("src", "/role-icons/allroles.webp");
  });

  it("can hide the text label", () => {
    render(<RoleChip role="Mid" showLabel={false} />);

    expect(screen.queryByText("Mid")).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeInTheDocument();
  });
});
