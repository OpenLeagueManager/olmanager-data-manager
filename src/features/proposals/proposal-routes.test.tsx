import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProposalDiff } from "@/domain/proposals/diff";
import type { ProposalPayload } from "@/domain/proposals/types";
import NewProposalPage from "@/app/(proposals)/proposals/new/[type]/page";
import { NewProposalRoute, ProposalDetailRoute, ProposalsRoute } from "./proposal-routes";
import {
  SESSION_PROPOSALS_STORAGE_KEY,
  type SessionProposal,
} from "./session-proposal-store";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound,
  useRouter: () => ({ push: navigationMocks.push }),
}));

afterEach(() => {
  window.sessionStorage.clear();
  navigationMocks.notFound.mockClear();
  navigationMocks.push.mockClear();
  vi.restoreAllMocks();
});

describe("proposal routes", () => {
  it("renders session proposals after mounting without trusting server-time storage", async () => {
    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([makeSessionProposal({ id: "proposal-route-list" })]),
    );

    const serverMarkup = renderToString(<ProposalsRoute />);
    expect(serverMarkup).toContain("No session proposals yet.");
    expect(serverMarkup).not.toContain("proposal-route-list");

    render(<ProposalsRoute />);

    await waitFor(() => {
      expect(screen.getByText("Transfer player-saka")).toBeVisible();
      expect(screen.getByText("Proposal ID: proposal-route-list")).toBeVisible();
    });
  });

  it("creates a draft proposal and redirects to the detail route", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("route-test-id");

    render(<NewProposalRoute proposalType="AddPlayer" />);

    fireEvent.change(screen.getByLabelText("Player ID"), {
      target: { value: "player-route-test" },
    });
    fireEvent.change(screen.getByLabelText("Player name"), {
      target: { value: "Route Test Player" },
    });
    fireEvent.change(screen.getByLabelText("Position"), { target: { value: "MF" } });
    fireEvent.change(screen.getByLabelText("Team"), { target: { value: "team-arsenal" } });
    fireEvent.change(screen.getByLabelText("Competition"), {
      target: { value: "competition-premier-league" },
    });
    fireEvent.change(screen.getByLabelText("Overall rating"), { target: { value: "72" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(navigationMocks.push).toHaveBeenCalledWith("/proposals/proposal-route-test-id");

    await waitFor(() => {
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toContain(
        "Route Test Player",
      );
    });
  });

  it("uses notFound for unsupported proposal type pages", async () => {
    await expect(
      NewProposalPage({ params: Promise.resolve({ type: "AssetUpload" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(navigationMocks.notFound).toHaveBeenCalledTimes(1);
  });

  it("keeps detail SSR and first client render stable before showing stored session state", async () => {
    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([makeSessionProposal({ id: "proposal-route-detail" })]),
    );

    const serverMarkup = renderToString(
      <ProposalDetailRoute proposalId="proposal-route-detail" />,
    );
    expect(serverMarkup).toContain("Loading session proposal");
    expect(serverMarkup).not.toContain("Proposal not found in this session");
    expect(serverMarkup).not.toContain("proposal-route-detail");

    render(<ProposalDetailRoute proposalId="proposal-route-detail" />);

    await waitFor(() => {
      expect(screen.getByText("Transfer player-saka")).toBeVisible();
      expect(screen.getByText("Proposal ID: proposal-route-detail")).toBeVisible();
    });
  });

  it("shows missing proposal detail state only after session hydration completes", async () => {
    const serverMarkup = renderToString(<ProposalDetailRoute proposalId="proposal-missing" />);
    expect(serverMarkup).toContain("Loading session proposal");
    expect(serverMarkup).not.toContain("Proposal not found in this session");

    render(<ProposalDetailRoute proposalId="proposal-missing" />);

    await waitFor(() => {
      expect(screen.getByText("Proposal not found in this session")).toBeVisible();
    });
  });
});

function makeSessionProposal({ id }: { id: string }): SessionProposal {
  const payload: ProposalPayload = {
    type: "TransferPlayer",
    playerId: "player-saka",
    fromTeamId: "team-arsenal",
    toTeamId: "team-brighton",
    competitionId: "competition-premier-league",
  };

  return {
    id,
    payload,
    review: { state: "submitted" },
    diff: buildProposalDiff(payload),
    createdAt: "2026-06-18T12:00:00.000Z",
    updatedAt: "2026-06-18T12:00:00.000Z",
  };
}
