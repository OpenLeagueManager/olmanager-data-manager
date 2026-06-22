import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { type ReactNode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildProposalDiff } from "@/domain/proposals/diff";
import { createValidator } from "@/domain/proposals/validation";
import type { DiffRecord, ProposalPayload, ProposalReview } from "@/domain/proposals/types";
import type { GameDataSet, SocialDataSet } from "@/lib/data/game-data-context";
import { GameDataProvider } from "@/lib/data/game-data-context";
import { getEmbeddedCompetition, getEmbeddedSocialCatalog } from "@/lib/olmanager/embedded";
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

const EMPTY_GAME: GameDataSet = { manifests: [], teams: [], players: [], staff: [] };
const EMPTY_SOCIAL: SocialDataSet = { accounts: [], templates: [] };
const STUB_DIFF = () => [] as DiffRecord[];

// Real game data provider for form tests that need field validation
function buildGameValidator() {
  try {
    const comp = getEmbeddedCompetition();
    const social = getEmbeddedSocialCatalog();
    const game: GameDataSet = { manifests: comp.manifests, teams: comp.teams, players: comp.players, staff: comp.staff };
    const socialData: SocialDataSet = { accounts: social.accounts, templates: social.templates };
    const { validateProposal } = createValidator(game, socialData);
    const buildDiff = (proposal: ProposalPayload) => buildProposalDiff(proposal, game, socialData);
    return { game, social: socialData, validateProposal, buildDiff } as const;
  } catch {
    return null;
  }
}

const GAME_V = buildGameValidator();
const REAL_PROPS = GAME_V
  ? GAME_V
  : { game: EMPTY_GAME, social: EMPTY_SOCIAL, validateProposal: (() => ({ ok: true, value: undefined }) as unknown) as ReturnType<typeof createValidator>["validateProposal"], buildDiff: STUB_DIFF };

function GameDataWrapper({ children }: { children: ReactNode }) {
  return (
    <GameDataProvider
      game={REAL_PROPS.game}
      social={REAL_PROPS.social}
      validateProposal={REAL_PROPS.validateProposal}
      buildProposalDiff={REAL_PROPS.buildDiff}
    >
      {children}
    </GameDataProvider>
  );
}

// Minimal validator for session store tests
const SESSION_VALIDATE = (input: unknown) => {
  const obj = input as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object") return { ok: false as const, errors: [{ field: "payload", message: "not an object" }] };
  if (typeof obj.type !== "string") return { ok: false as const, errors: [{ field: "type", message: "missing type" }] };
  const known = ["AddPlayer", "EditPlayer", "TransferPlayer", "ReleasePlayer", "AddStaff", "EditStaff", "ReleaseStaff", "EditTeam", "RemoveTeam", "EditCompetition", "RemoveCompetition", "AddSocialAccount", "EditSocialTemplate", "AddNewsTemplate"];
  if (!known.includes(obj.type)) return { ok: false as const, errors: [{ field: "type", message: `unknown type: ${obj.type}` }] };
  return { ok: true, value: input } as { ok: true; value: ProposalPayload };
};

function SessionStoreWrapper({ children }: { children: ReactNode }) {
  return (
    <GameDataProvider game={EMPTY_GAME} social={EMPTY_SOCIAL} validateProposal={SESSION_VALIDATE} buildProposalDiff={STUB_DIFF}>
      <ProposalSessionStoreProvider>{children}</ProposalSessionStoreProvider>
    </GameDataProvider>
  );
}

afterEach(() => {
  window.sessionStorage.clear();
});

describe("proposal form components", () => {
  it("shows domain field errors for invalid AddPlayer form values", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="AddPlayer" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

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
    render(<GameDataWrapper><ProposalForm proposalType="AddPlayer" onProposalAccepted={vi.fn()} /></GameDataWrapper>);

    expect(screen.getByText("Computed OVR:")).toBeVisible();
    expect(screen.getByText("75")).toBeVisible();
  });

  it("renders PR3 proposal forms without errors", () => {
    const types: import("@/domain/proposals/types").ProposalType[] = [
      "EditCompetition",
      "AddSocialAccount",
      "EditSocialTemplate",
      "AddNewsTemplate",
    ];

    for (const proposalType of types) {
      const { unmount } = render(
        <GameDataWrapper><ProposalForm proposalType={proposalType} onProposalAccepted={vi.fn()} /></GameDataWrapper>,
      );
      expect(screen.getByRole("button", { name: "Create draft proposal" })).toBeVisible();
      unmount();
    }
  });

  it("creates an EditCompetition proposal from the form", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="EditCompetition" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Competition/), { target: { value: "lec" } });
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "LEC 2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(onProposalAccepted).toHaveBeenCalledWith({
      version: 2,
      type: "EditCompetition",
      competitionId: "lec",
      changes: { name: "LEC 2026" },
    });
  });

  it("shows favorite team ID errors on the AddSocialAccount form", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="AddSocialAccount" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Language/), { target: { value: "en" } });
    fireEvent.change(screen.getByLabelText(/Display name/), { target: { value: "New Fan" } });
    fireEvent.change(screen.getByLabelText(/Handle/), { target: { value: "@newfan" } });
    fireEvent.change(screen.getByLabelText(/Author type/), { target: { value: "Fan" } });
    fireEvent.change(screen.getByLabelText(/Favorite team IDs/), {
      target: { value: "team-missing" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(screen.getByText("Team does not exist.")).toBeVisible();
    expect(onProposalAccepted).not.toHaveBeenCalled();
  });

  it("creates an AddSocialAccount proposal with active defaulting to true", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="AddSocialAccount" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Language/), { target: { value: "en" } });
    fireEvent.change(screen.getByLabelText(/Display name/), { target: { value: "New Fan" } });
    fireEvent.change(screen.getByLabelText(/Handle/), { target: { value: "@newfan" } });
    fireEvent.change(screen.getByLabelText(/Author type/), { target: { value: "Fan" } });
    fireEvent.change(screen.getByLabelText(/Favorite team IDs/), {
      target: { value: "lec-g2-esports" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(onProposalAccepted).toHaveBeenCalledWith({
      version: 2,
      type: "AddSocialAccount",
      account: {
        language: "en",
        display_name: "New Fan",
        handle: "@newfan",
        author_type: "Fan",
        profile_image_url: null,
        favorite_team_ids: ["lec-g2-esports"],
        active: true,
      },
    });
  });

  it("creates an EditSocialTemplate proposal from the form", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="EditSocialTemplate" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Social template/), {
      target: { value: "team-banter-en-1" },
    });
    fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(onProposalAccepted).toHaveBeenCalledWith({
      version: 2,
      type: "EditSocialTemplate",
      templateId: "team-banter-en-1",
      changes: { weight: 7 },
    });
  });

  it("creates an AddNewsTemplate proposal with body_variants", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="AddNewsTemplate" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: "Editorial" } });
    fireEvent.change(screen.getByLabelText(/Headline key/), { target: { value: "be.news.test.headline" } });
    fireEvent.change(screen.getByLabelText(/Headline text/), { target: { value: "Test headline" } });
    fireEvent.change(screen.getByLabelText(/Body variant key/), {
      target: { value: "be.news.test.body" },
    });
    fireEvent.change(screen.getByLabelText(/Body variant text/), {
      target: { value: "Test variant {team}." },
    });
    fireEvent.change(screen.getByLabelText(/Source key/), { target: { value: "be.source.test" } });
    fireEvent.change(screen.getByLabelText(/Source text/), { target: { value: "Test Source" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(onProposalAccepted).toHaveBeenCalledWith({
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        sources: [{ key: "be.source.test", text: "Test Source" }],
        body_variants: [{ body_key: "be.news.test.body", text: "Test variant {team}." }],
      },
    });
  });

  it("shows a body error when AddNewsTemplate form has neither body nor body_variants", () => {
    const onProposalAccepted = vi.fn();
    render(<GameDataWrapper><ProposalForm proposalType="AddNewsTemplate" onProposalAccepted={onProposalAccepted} /></GameDataWrapper>);

    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: "Editorial" } });
    fireEvent.change(screen.getByLabelText(/Headline key/), { target: { value: "be.news.test.headline" } });
    fireEvent.change(screen.getByLabelText(/Headline text/), { target: { value: "Test headline" } });
    fireEvent.change(screen.getByLabelText(/Source key/), { target: { value: "be.source.test" } });
    fireEvent.change(screen.getByLabelText(/Source text/), { target: { value: "Test Source" } });
    fireEvent.click(screen.getByRole("button", { name: "Create draft proposal" }));

    expect(screen.getByText("Body or at least one body variant is required.")).toBeVisible();
    expect(onProposalAccepted).not.toHaveBeenCalled();
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
      <SessionStoreWrapper>
        <NoticeHarness />
      </SessionStoreWrapper>,
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
      <SessionStoreWrapper>
        <SessionStoreHarness />
      </SessionStoreWrapper>,
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
      <SessionStoreWrapper>
        <SessionStoreHarness />
      </SessionStoreWrapper>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add draft" }));

    await waitFor(() => {
      expect(window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY)).toContain(
        "Persisted Player",
      );
    });

    unmount();

    render(
      <SessionStoreWrapper>
        <SessionStoreHarness />
      </SessionStoreWrapper>,
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
      <SessionStoreWrapper>
        <SessionStoreHarness />
      </SessionStoreWrapper>,
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
    diff: buildProposalDiff(payload, { manifests: [], teams: [], players: [], staff: [] }, { templates: [] }),
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
