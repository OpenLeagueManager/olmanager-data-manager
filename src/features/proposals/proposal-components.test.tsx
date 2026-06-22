import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProposalDiff } from "@/domain/proposals/diff";
import type { ProposalPayload, ProposalReview } from "@/domain/proposals/types";
import { ProposalForm } from "./proposal-form";
import { ProposalDetail } from "./proposal-presenters";
import { ReviewControls } from "./review-controls";
import {
  LEGACY_SESSION_PROPOSALS_STORAGE_KEY,
  ProposalSessionStoreProvider,
  SESSION_PROPOSALS_STORAGE_KEY,
  useProposalSessionStore,
  useProposalSessionStoreNotice,
  type SessionProposal,
} from "./session-proposal-store";

afterEach(() => {
  window.sessionStorage.clear();
});

describe("proposal form components", () => {
  it("shows domain field errors for invalid AddPlayer form values", () => {
    const onProposalAccepted = vi.fn();
    render(<ProposalForm proposalType="AddPlayer" onProposalAccepted={onProposalAccepted} />);

    fireEvent.change(screen.getByLabelText(/Match name/), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText(/Position/), { target: { value: "Mid" } });
    fireEvent.change(screen.getByLabelText(/Team/), { target: { value: "lec-g2-esports" } });
    fireEvent.change(screen.getByLabelText(/Nationality/), { target: { value: "DK" } });
    fireEvent.change(screen.getByLabelText(/Wage/), { target: { value: "100000" } });
    fireEvent.change(screen.getByLabelText(/Market value/), { target: { value: "150000" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(screen.getByText("A non-empty string is required.")).toBeVisible();
    expect(onProposalAccepted).not.toHaveBeenCalled();
  });

  it("shows computed OVR while filling player attributes", () => {
    render(<ProposalForm proposalType="AddPlayer" onProposalAccepted={vi.fn()} />);

    expect(screen.getByText("Computed OVR:")).toBeVisible();
    expect(screen.getByText("75")).toBeVisible();
  });
});

describe("proposal review components", () => {
  it("shows visible rejection state and stub reviewer metadata", () => {
    render(<ReviewHarness initialReview={{ state: "submitted" }} />);

    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: "Missing source evidence." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject with stub reviewer" }));

    expect(screen.getByText("rejected")).toBeVisible();
    expect(screen.getByText("Missing source evidence.")).toBeVisible();
    expect(screen.getByText(/Reviewed by Stub Reviewer using non-production stub identity/)).toBeVisible();
  });

  it("shows rejection field error before recording a rejected state", () => {
    render(<ReviewHarness initialReview={{ state: "submitted" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Reject with stub reviewer" }));

    expect(screen.getByText("Rejection reason is required.")).toBeVisible();
    expect(screen.getByText("submitted")).toBeVisible();
  });

  it("shows the non-submitted info message and hides review actions for draft reviews", () => {
    render(<ReviewHarness initialReview={{ state: "draft" }} />);

    expect(
      screen.getByText("Review actions are available only for submitted proposals."),
    ).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("proposal session store", () => {
  it("discards v1 football-shaped stored proposals and shows a one-time notice", () => {
    window.sessionStorage.setItem(
      LEGACY_SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([makeSessionProposal({ state: "draft" })]),
    );

    render(
      <ProposalSessionStoreProvider>
        <NoticeHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText(/older schema and were cleared/i)).toBeVisible();
    expect(window.sessionStorage.getItem(LEGACY_SESSION_PROPOSALS_STORAGE_KEY)).toBeNull();
  });

  it("recovers from malformed session data before hydrating proposals", async () => {
    const validProposal = makeSessionProposal({ state: "draft" });
    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([
        { ...validProposal, id: "not-a-proposal-id" },
        { ...validProposal, payload: { type: "UnsupportedProposal", version: 2 } },
        validProposal,
      ]),
    );

    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText("Stored proposals: 1")).toBeVisible();
    expect(screen.getByText("First proposal: proposal-component-test")).toBeVisible();

    await waitFor(() => {
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toContain(
        "proposal-component-test",
      );
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).not.toContain(
        "UnsupportedProposal",
      );
    });
  });

  it("persists, restores, and clears session-backed proposals", async () => {
    const { unmount } = render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add draft" }));

    await waitFor(() => {
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toContain(
        "Persisted Player",
      );
    });

    unmount();

    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText("Stored proposals: 1")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Clear proposals" }));

    await waitFor(() => {
      expect(screen.getByText("Stored proposals: 0")).toBeVisible();
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toBe("[]");
    });
  });

  it("records stub reviewer metadata when approving a submitted proposal", () => {
    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit first proposal" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve first proposal" }));

    expect(screen.getByText("First state: approved")).toBeVisible();
    expect(screen.getByText("Reviewer: Stub Reviewer")).toBeVisible();
  });
});

function NoticeHarness() {
  const { notice, dismiss } = useProposalSessionStoreNotice();
  return (
    <div>
      {notice ? <p>{notice}</p> : <p>No notice</p>}
      <button onClick={dismiss} type="button">
        Dismiss
      </button>
    </div>
  );
}

function ReviewHarness({ initialReview }: { initialReview: ProposalReview }) {
  const [review, setReview] = useState(initialReview);
  const proposal = makeSessionProposal(review);

  return (
    <>
      <ProposalDetail proposal={proposal} />
      <ReviewControls review={review} onReviewChange={setReview} />
    </>
  );
}

function makeSessionProposal(review: ProposalReview): SessionProposal {
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
    id: "proposal-component-test",
    payload,
    review,
    diff: buildProposalDiff(payload),
    createdAt: "2026-06-18T12:00:00.000Z",
    updatedAt: "2026-06-18T12:00:00.000Z",
  };
}

function SessionStoreHarness() {
  const store = useProposalSessionStore();
  const firstProposal = store.proposals[0];

  function addDraft() {
    store.addDraft({
      version: 2,
      type: "AddPlayer",
      player: {
        full_name: "Persisted Player",
        match_name: "Persisted",
        position: "Mid",
        team_id: "lec-g2-esports",
        nationality: "DK",
        wage: 100000,
        market_value: 150000,
        attributes: {
          mechanics: 75,
          laning: 75,
          teamfighting: 75,
          macro_play: 75,
          consistency: 75,
          shotcalling: 75,
          champion_pool: 75,
          discipline: 75,
          mental_resilience: 75,
        },
        date_of_birth: "2000-01-01",
        contract_end: "",
      },
    });
  }

  function submitFirstProposal() {
    if (firstProposal) {
      store.submitDraft(firstProposal.id);
    }
  }

  function approveFirstProposal() {
    if (firstProposal) {
      store.applyReviewAction(firstProposal.id, {
        type: "approve",
        reviewer: {
          reviewerId: "stub-reviewer",
          displayName: "Stub Reviewer",
          identityModel: "stub",
          reviewedAt: "2026-06-18T12:00:00.000Z",
        },
      });
    }
  }

  return (
    <section>
      <p>Stored proposals: {store.proposals.length}</p>
      <p>First proposal: {firstProposal?.id ?? "none"}</p>
      <p>First state: {firstProposal?.review.state ?? "none"}</p>
      <p>Reviewer: {firstProposal?.review.reviewer?.displayName ?? "none"}</p>
      <button onClick={addDraft} type="button">
        Add draft
      </button>
      <button onClick={submitFirstProposal} type="button">
        Submit first proposal
      </button>
      <button onClick={approveFirstProposal} type="button">
        Approve first proposal
      </button>
      <button onClick={store.clearSessionProposals} type="button">
        Clear proposals
      </button>
    </section>
  );
}
