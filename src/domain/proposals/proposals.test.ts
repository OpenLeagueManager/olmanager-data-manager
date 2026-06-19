import { describe, expect, it } from "vitest";
import { buildProposalDiff } from "./diff";
import { PLAYER_RATING_ERROR_MESSAGE, PLAYER_RATING_MAX, PLAYER_RATING_MIN } from "./rating";
import { transitionReviewState } from "./review-state";
import type { ProposalPayload, ReviewerMetadata } from "./types";
import { parseProposalType, validateProposal } from "./validation";

const reviewer: ReviewerMetadata = {
  reviewerId: "reviewer-1",
  displayName: "Stub Reviewer",
  reviewedAt: "2026-06-18T12:00:00.000Z",
  identityModel: "stub",
};

describe("proposal validation", () => {
  it("parses supported proposal types and rejects unsupported ones", () => {
    expect(parseProposalType("TransferPlayer")).toEqual({
      ok: true,
      value: "TransferPlayer",
    });

    expect(parseProposalType("UploadPlayerAsset")).toEqual({
      ok: false,
      errors: [{ field: "type", message: "Unsupported proposal type." }],
    });
  });

  it("returns field-level errors for fixture-invalid transfer references", () => {
    const result = validateProposal({
      type: "TransferPlayer",
      playerId: "player-missing",
      fromTeamId: "team-missing",
      toTeamId: "team-also-missing",
      competitionId: "competition-missing",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "playerId", message: "Player does not exist." },
        { field: "fromTeamId", message: "Source team does not exist." },
        { field: "toTeamId", message: "Destination team does not exist." },
        { field: "competitionId", message: "Competition does not exist." },
      ]);
    }
  });

  it("rejects duplicate AddPlayer IDs and out-of-range ratings", () => {
    const result = validateProposal({
      type: "AddPlayer",
      player: {
        id: "player-saka",
        name: "Duplicate Player",
        position: "FW",
        teamId: "team-arsenal",
        competitionId: "competition-premier-league",
        overall: 100,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "player.overall", message: PLAYER_RATING_ERROR_MESSAGE },
        { field: "player.id", message: "Player ID already exists." },
      ]);
    }
  });

  it("accepts AddPlayer rating boundaries", () => {
    expect(
      validateProposal({
        type: "AddPlayer",
        player: {
          id: "player-min-rating",
          name: "Minimum Rating",
          position: "DF",
          teamId: "team-arsenal",
          competitionId: "competition-premier-league",
          overall: PLAYER_RATING_MIN,
        },
      }),
    ).toEqual({
      ok: true,
      value: {
        type: "AddPlayer",
        player: {
          id: "player-min-rating",
          name: "Minimum Rating",
          position: "DF",
          teamId: "team-arsenal",
          competitionId: "competition-premier-league",
          overall: PLAYER_RATING_MIN,
        },
      },
    });

    expect(
      validateProposal({
        type: "AddPlayer",
        player: {
          id: "player-max-rating",
          name: "Maximum Rating",
          position: "MF",
          teamId: "team-real-madrid",
          competitionId: "competition-la-liga",
          overall: PLAYER_RATING_MAX,
        },
      }),
    ).toEqual({
      ok: true,
      value: {
        type: "AddPlayer",
        player: {
          id: "player-max-rating",
          name: "Maximum Rating",
          position: "MF",
          teamId: "team-real-madrid",
          competitionId: "competition-la-liga",
          overall: PLAYER_RATING_MAX,
        },
      },
    });
  });

  it("rejects empty or invalid EditPlayerAttributes attributes", () => {
    const emptyAttributesResult = validateProposal({
      type: "EditPlayerAttributes",
      playerId: "player-saka",
      attributes: {},
    });

    expect(emptyAttributesResult.ok).toBe(false);
    if (!emptyAttributesResult.ok) {
      expect(emptyAttributesResult.errors).toEqual([
        { field: "attributes", message: "At least one editable attribute is required." },
      ]);
    }

    const invalidAttributesResult = validateProposal({
      type: "EditPlayerAttributes",
      playerId: "player-saka",
      attributes: {
        name: " ",
        position: "ST",
        overall: 0,
      },
    });

    expect(invalidAttributesResult.ok).toBe(false);
    if (!invalidAttributesResult.ok) {
      expect(invalidAttributesResult.errors).toEqual([
        { field: "attributes.name", message: "A non-empty string is required." },
        { field: "attributes.position", message: "A supported player position is required." },
        { field: "attributes.overall", message: PLAYER_RATING_ERROR_MESSAGE },
      ]);
    }
  });

  it("rejects same-team transfers and source-team mismatches", () => {
    const sameTeamResult = validateProposal({
      type: "TransferPlayer",
      playerId: "player-saka",
      fromTeamId: "team-arsenal",
      toTeamId: "team-arsenal",
      competitionId: "competition-premier-league",
    });

    expect(sameTeamResult.ok).toBe(false);
    if (!sameTeamResult.ok) {
      expect(sameTeamResult.errors).toEqual([
        { field: "toTeamId", message: "Destination team must differ from source team." },
      ]);
    }

    const sourceMismatchResult = validateProposal({
      type: "TransferPlayer",
      playerId: "player-saka",
      fromTeamId: "team-brighton",
      toTeamId: "team-real-madrid",
      competitionId: "competition-la-liga",
    });

    expect(sourceMismatchResult.ok).toBe(false);
    if (!sourceMismatchResult.ok) {
      expect(sourceMismatchResult.errors).toEqual([
        { field: "fromTeamId", message: "Source team does not match player's current team." },
      ]);
    }
  });

  it("does not report same-team transfer errors for the same missing source and destination ID", () => {
    const result = validateProposal({
      type: "TransferPlayer",
      playerId: "player-saka",
      fromTeamId: "team-missing",
      toTeamId: "team-missing",
      competitionId: "competition-premier-league",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "fromTeamId", message: "Source team does not exist." },
        { field: "toTeamId", message: "Destination team does not exist." },
      ]);
    }
  });

  it("normalizes valid fixture-backed proposals", () => {
    const result = validateProposal({
      type: "AddPlayer",
      player: {
        id: "player-new-forward",
        name: " New Forward ",
        position: "FW",
        teamId: "team-arsenal",
        competitionId: "competition-premier-league",
        overall: 75,
      },
    });

    expect(result).toEqual({
      ok: true,
      value: {
        type: "AddPlayer",
        player: {
          id: "player-new-forward",
          name: "New Forward",
          position: "FW",
          teamId: "team-arsenal",
          competitionId: "competition-premier-league",
          overall: 75,
        },
      },
    });
  });
});

describe("proposal diffs", () => {
  it("emits deterministic changed fields and omits unchanged attributes", () => {
    const proposal: ProposalPayload = {
      type: "EditPlayerAttributes",
      playerId: "player-saka",
      attributes: {
        name: "Bukayo Saka",
        position: "MF",
        overall: 88,
      },
    };

    expect(buildProposalDiff(proposal)).toEqual([
      { field: "player.position", before: "FW", after: "MF", severity: "info" },
      { field: "player.overall", before: 86, after: 88, severity: "info" },
    ]);
  });

  it("shows reviewer-readable team names for transfers", () => {
    const proposal: ProposalPayload = {
      type: "TransferPlayer",
      playerId: "player-saka",
      fromTeamId: "team-arsenal",
      toTeamId: "team-brighton",
      competitionId: "competition-premier-league",
    };

    expect(buildProposalDiff(proposal)).toEqual([
      {
        field: "player.team",
        before: "Arsenal",
        after: "Brighton & Hove Albion",
        severity: "warning",
      },
    ]);
  });
});

describe("review state transitions", () => {
  it("submits drafts and records approved reviewer metadata", () => {
    const submitted = transitionReviewState({ state: "draft" }, { type: "submit" });
    expect(submitted).toEqual({ ok: true, value: { state: "submitted" } });

    if (!submitted.ok) {
      throw new Error("Expected submitted state");
    }

    expect(
      transitionReviewState(submitted.value, { type: "approve", reviewer }),
    ).toEqual({
      ok: true,
      value: { state: "approved", reviewer },
    });
  });

  it("requires rejection reasons and blocks invalid transitions", () => {
    expect(
      transitionReviewState({ state: "submitted" }, { type: "reject", reviewer, reason: "  " }),
    ).toEqual({
      ok: false,
      errors: [{ field: "rejectionReason", message: "Rejection reason is required." }],
    });

    expect(
      transitionReviewState({ state: "approved", reviewer }, { type: "submit" }),
    ).toEqual({
      ok: false,
      errors: [
        {
          field: "state",
          message: "Cannot submit a proposal in approved state.",
        },
      ],
    });

    expect(
      transitionReviewState(
        { state: "submitted" },
        { type: "reject", reviewer, reason: "Missing source." },
      ),
    ).toEqual({
      ok: true,
      value: {
        state: "rejected",
        reviewer,
        rejectionReason: "Missing source.",
      },
    });
  });
});
