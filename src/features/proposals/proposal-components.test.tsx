import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProposalDiff } from "@/domain/proposals/diff";
import { PLAYER_RATING_ERROR_MESSAGE } from "@/domain/proposals/rating";
import type { ProposalPayload, ProposalReview, ReviewerMetadata } from "@/domain/proposals/types";
import { ProposalForm } from "./proposal-form";
import { ProposalDetail } from "./proposal-presenters";
import { ReviewControls } from "./review-controls";
import {
  ProposalSessionStoreProvider,
  SESSION_PROPOSALS_STORAGE_KEY,
  useProposalSessionStore,
  type SessionProposal,
} from "./session-proposal-store";

afterEach(() => {
  window.sessionStorage.clear();
});

describe("proposal form components", () => {
  it("shows domain field errors for invalid AddPlayer form values", () => {
    const onProposalAccepted = vi.fn();
    render(<ProposalForm proposalType="AddPlayer" onProposalAccepted={onProposalAccepted} />);

    fireEvent.change(screen.getByLabelText("Player ID"), {
      target: { value: "player-saka" },
    });
    fireEvent.change(screen.getByLabelText("Player name"), {
      target: { value: "Duplicate Player" },
    });
    fireEvent.change(screen.getByLabelText("Position"), { target: { value: "FW" } });
    fireEvent.change(screen.getByLabelText("Team"), { target: { value: "team-arsenal" } });
    fireEvent.change(screen.getByLabelText("Competition"), {
      target: { value: "competition-premier-league" },
    });
    fireEvent.change(screen.getByLabelText("Overall rating"), { target: { value: "100" } });

    fireEvent.submit(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(screen.getByText("Player ID already exists.")).toBeVisible();
    expect(screen.getByText(PLAYER_RATING_ERROR_MESSAGE)).toBeVisible();
    expect(onProposalAccepted).not.toHaveBeenCalled();
  });

  it("synchronizes aria-invalid when native constraints fail", () => {
    render(<ProposalForm proposalType="AddPlayer" onProposalAccepted={vi.fn()} />);

    const playerId = screen.getByLabelText("Player ID");
    fireEvent.invalid(playerId);

    expect(playerId).toHaveAttribute("aria-invalid", "true");
    expect(playerId).toHaveAttribute("data-user-invalid");
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

  it("clears the visible rejection reason error when the reviewer enters a reason", () => {
    render(<ReviewHarness initialReview={{ state: "submitted" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Reject with stub reviewer" }));
    expect(screen.getByText("Rejection reason is required.")).toBeVisible();

    fireEvent.input(screen.getByLabelText("Rejection reason"), {
      target: { value: "Needs source evidence." },
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the rejection reason error visible for whitespace-only corrections", () => {
    render(<ReviewHarness initialReview={{ state: "submitted" }} />);

    fireEvent.click(screen.getByRole("button", { name: "Reject with stub reviewer" }));

    const rejectionReason = screen.getByLabelText("Rejection reason");
    fireEvent.input(rejectionReason, { target: { value: "   " } });

    expect(screen.getByRole("alert")).toHaveTextContent("Rejection reason is required.");
    expect(rejectionReason).toHaveAttribute("aria-invalid", "true");
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
  it("recovers from malformed session data before hydrating proposals", async () => {
    const validProposal = makeSessionProposal({ state: "draft" });
    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([
        { ...validProposal, id: "not-a-proposal-id" },
        { ...validProposal, payload: { type: "UnsupportedProposal" } },
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

  it("discards hydrated approved or rejected reviews without valid reviewer metadata", () => {
    const approvedWithoutReviewer = makeSessionProposal({ state: "approved" });
    const rejectedWithoutReviewer = makeSessionProposal({
      state: "rejected",
      rejectionReason: "Missing reviewer metadata.",
    });
    const submittedProposal = makeSessionProposal({ state: "submitted" });

    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([approvedWithoutReviewer, rejectedWithoutReviewer, submittedProposal]),
    );

    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText("Stored proposals: 1")).toBeVisible();
    expect(screen.getByText("First state: submitted")).toBeVisible();
  });

  it("discards hydrated reviewed proposals with malformed reviewer metadata fields", () => {
    const validReviewer = {
      reviewerId: "stub-reviewer",
      displayName: "Stub Reviewer",
      identityModel: "stub",
      reviewedAt: "2026-06-18T12:00:00.000Z",
    } satisfies ReviewerMetadata;
    const validReviewedProposal = makeSessionProposal({
      state: "approved",
      reviewer: validReviewer,
    });
    const malformedReviewerMetadata = [
      { ...validReviewer, reviewerId: "   " },
      { ...validReviewer, displayName: "   " },
      { ...validReviewer, reviewedAt: "not-a-date" },
      { ...validReviewer, identityModel: "discord" },
    ];

    window.sessionStorage.setItem(
      SESSION_PROPOSALS_STORAGE_KEY,
      JSON.stringify([
        ...malformedReviewerMetadata.map((reviewer) =>
          makeSessionProposal({ state: "approved", reviewer: reviewer as ReviewerMetadata }),
        ),
        validReviewedProposal,
      ]),
    );

    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText("Stored proposals: 1")).toBeVisible();
    expect(screen.getByText("First state: approved")).toBeVisible();
    expect(screen.getByText("Reviewer: Stub Reviewer")).toBeVisible();
  });

  it("recovers gracefully from unparseable session storage content", () => {
    window.sessionStorage.setItem(SESSION_PROPOSALS_STORAGE_KEY, "not-valid-json{{{");

    render(
      <ProposalSessionStoreProvider>
        <SessionStoreHarness />
      </ProposalSessionStoreProvider>,
    );

    expect(screen.getByText("Stored proposals: 0")).toBeVisible();
  });

  it("renders deterministic UTC dates in proposal presenters", () => {
    render(<ProposalDetail proposal={makeSessionProposal({ state: "submitted" })} />);

    expect(screen.getByText("Created: Jun 18, 2026, 12:00 PM")).toBeVisible();
  });
});

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
    type: "TransferPlayer",
    playerId: "player-saka",
    fromTeamId: "team-arsenal",
    toTeamId: "team-brighton",
    competitionId: "competition-premier-league",
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
      type: "AddPlayer",
      player: {
        id: `player-persisted-${store.proposals.length}`,
        name: "Persisted Player",
        position: "MF",
        teamId: "team-arsenal",
        competitionId: "competition-premier-league",
        overall: 72,
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
