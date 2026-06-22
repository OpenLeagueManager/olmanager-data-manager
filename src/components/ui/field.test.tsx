import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./field";

describe("Field", () => {
  it("associates label, input, hint, and error by id", () => {
    render(
      <Field error="Invalid value" hint="Use a unique ID" htmlFor="player-id" label="Player ID">
        <input id="player-id" />
      </Field>,
    );

    expect(screen.getByLabelText("Player ID")).toHaveAttribute("id", "player-id");
    expect(screen.getByText("Use a unique ID")).toHaveAttribute("id", "player-id-hint");
    expect(screen.getByRole("alert")).toHaveAttribute("id", "player-id-error");
    expect(screen.getByText("Invalid value")).toBeVisible();
  });

  it("marks required labels", () => {
    render(
      <Field htmlFor="name" label="Name" required>
        <input id="name" />
      </Field>,
    );

    expect(screen.getByText("Name *")).toBeVisible();
  });
});
