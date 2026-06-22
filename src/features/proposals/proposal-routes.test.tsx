import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProposalDiff } from "@/domain/proposals/diff";
import type { ProposalId, ProposalPayload } from "@/domain/proposals/types";
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
      JSON.stringify([makeSessionProposal({ id: "proposal-route-list" as ProposalId })]),
    );

    const serverMarkup = renderToString(<ProposalsRoute />);
    expect(serverMarkup).toContain("No session proposals yet.");
    expect(serverMarkup).not.toContain("proposal-route-list");

    render(<ProposalsRoute />);

    await waitFor(() => {
      expect(screen.getByText("Transfer lec-player-98767975968177297")).toBeVisible();
      expect(screen.getByText("Proposal ID: proposal-route-list")).toBeVisible();
    });
  });

  it("creates a draft proposal and redirects to the detail route", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("route-test-id");

    render(<NewProposalRoute proposalType="AddPlayer" />);

    fireEvent.change(screen.getByLabelText(/Full name/), { target: { value: "Route Test" } });
    fireEvent.change(screen.getByLabelText(/Match name/), { target: { value: "RouteTest" } });
    fireEvent.change(screen.getByLabelText(/Position/), { target: { value: "Mid" } });
    fireEvent.change(screen.getByLabelText(/Team/), { target: { value: "lec-g2-esports" } });
    fireEvent.change(screen.getByLabelText(/Nationality/), { target: { value: "DK" } });
    fireEvent.change(screen.getByLabelText(/Wage/), { target: { value: "100000" } });
    fireEvent.change(screen.getByLabelText(/Market value/), { target: { value: "150000" } });
    fireEvent.change(screen.getByLabelText(/Date of birth/), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(navigationMocks.push).toHaveBeenCalledWith("/proposals/proposal-route-test-id");

    await waitFor(() => {
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toContain("Route Test");
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
      JSON.stringify([makeSessionProposal({ id: "proposal-route-detail" as ProposalId })]),
    );

    const serverMarkup = renderToString(
      <ProposalDetailRoute proposalId="proposal-route-detail" />,
    );
    expect(serverMarkup).toContain("Loading session proposal");
    expect(serverMarkup).not.toContain("Proposal not found in this session");
    expect(serverMarkup).not.toContain("proposal-route-detail");

    render(<ProposalDetailRoute proposalId="proposal-route-detail" />);

    await waitFor(() => {
      expect(screen.getByText("Transfer lec-player-98767975968177297")).toBeVisible();
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

function makeSessionProposal({ id }: { id: ProposalId }): SessionProposal {
  const payload: ProposalPayload = {
    version: 2,
    type: "TransferPlayer",
    playerId: "lec-player-98767975968177297",
    fromTeamId: "lec-g2-esports",
    toTeamId: "lec-fnatic",
    competitionId: "lec",
    wageOffered: 300000,
    fee: 100000,
    contractEnd: "2027-11-16",
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
