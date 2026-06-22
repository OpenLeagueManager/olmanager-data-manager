import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

describe("Breadcrumbs", () => {
  it("renders an ARIA labelled navigation with links", () => {
    render(
      <Breadcrumbs
        crumbs={[
          { label: "Data", href: "/data" },
          { label: "LEC", href: "/data/competitions/lec" },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Data" })).toHaveAttribute("href", "/data");
    expect(screen.getByRole("link", { name: "LEC" })).toHaveAttribute("href", "/data/competitions/lec");
  });
});
