import { describe, expect, it } from "vitest";
import { calculateLolOvr } from "@/data/olmanager/rating";
import { buildProposalDiff } from "./diff";
import { transitionReviewState } from "./review-state";
import type { ProposalPayload, ReviewerMetadata } from "./types";
import { createValidator, parseProposalType } from "./validation";
import type {
  CompetitionManifest,
  Player,
  SocialAccountData,
  SocialTemplateData,
  Staff,
  Team,
} from "@/data/olmanager/types";
import lecManifest from "@/data/competitions/lec/manifest.json";
import lecPlayers from "@/data/players/lec_players.json";
import lecStaffs from "@/data/staffs/lec_staffs.json";
import lecTeams from "@/data/teams/lec_teams.json";
import socialTemplates from "@/data/social/templates.json";

const game = {
  manifests: [lecManifest as CompetitionManifest],
  teams: lecTeams.teams as Team[],
  players: lecPlayers.players as Player[],
  staff: lecStaffs.staff as Staff[],
};

const social = {
  accounts: [] satisfies SocialAccountData[],
  templates: socialTemplates.templates as SocialTemplateData[],
};

const { validateProposal } = createValidator(game, social);
const buildDiff = (proposal: ProposalPayload) => buildProposalDiff(proposal, game, social);

const reviewer: ReviewerMetadata = {
  reviewerId: "reviewer-1",
  displayName: "Stub Reviewer",
  reviewedAt: "2026-06-18T12:00:00.000Z",
  identityModel: "stub",
};

const validAddPlayer = {
  version: 2,
  type: "AddPlayer",
  player: {
    full_name: "Test Player",
    match_name: "Test",
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
} as const;

const validCapsAttributes = {
  mechanics: 85,
  laning: 85,
  teamfighting: 88,
  macro_play: 93,
  consistency: 90,
  shotcalling: 93,
  champion_pool: 86,
  discipline: 90,
  mental_resilience: 92,
} as const;

describe("proposal validation", () => {
  it("parses supported proposal types and rejects unsupported ones", () => {
    expect(parseProposalType("TransferPlayer")).toEqual({
      ok: true,
      value: "TransferPlayer",
    });

    expect(parseProposalType("UploadPlayerAsset")).toEqual({
      ok: false,
      errors: [
        {
          field: "type",
          message:
            "Unsupported proposal type. Supported types: AddPlayer, EditPlayer, TransferPlayer, AddStaff, EditStaff, ReleaseStaff, EditTeam, EditCompetition, AddSocialAccount, EditSocialTemplate, AddNewsTemplate.",
        },
      ],
    });
  });

  it("rejects v1 football-shaped payloads", () => {
    const v1 = {
      type: "EditPlayerAttributes",
      playerId: "lec-player-98767975968177297",
      attributes: { name: "Old" },
    };

    const result = validateProposal(v1);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "version", message: "Proposal version must be 2." },
      ]);
    }
  });

  it("accepts a valid AddPlayer proposal", () => {
    const result = validateProposal(validAddPlayer);
    expect(result).toEqual({ ok: true, value: validAddPlayer });
  });

  it("rejects invalid ISO dates for date_of_birth and contract_end", () => {
    const result = validateProposal({
      ...validAddPlayer,
      player: {
        ...validAddPlayer.player,
        date_of_birth: "not-a-date",
        contract_end: "2026-02-30",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "player.date_of_birth", message: "A valid ISO date (YYYY-MM-DD) is required." },
        { field: "player.contract_end", message: "A valid ISO date (YYYY-MM-DD) is required." },
      ]);
    }
  });

  it("rejects AddPlayer with invalid role, team, and attributes", () => {
    const result = validateProposal({
      version: 2,
      type: "AddPlayer",
      player: {
        ...validAddPlayer.player,
        position: "Striker",
        team_id: "team-missing",
        attributes: { ...validAddPlayer.player.attributes, mechanics: 101 },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "player.position", message: "A supported LoL role is required." },
        { field: "player.team_id", message: "Team does not exist." },
        { field: "player.attributes.mechanics", message: "Rating must be an integer from 1 to 99." },
      ]);
    }
  });

  it("accepts EditPlayer with nested attribute changes", () => {
    const result = validateProposal({
      version: 2,
      type: "EditPlayer",
      playerId: "lec-player-98767975968177297",
      changes: {
        match_name: "CAPS",
        attributes: { mechanics: 90 },
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value.type === "EditPlayer") {
      expect(result.value.changes.match_name).toBe("CAPS");
      expect(result.value.changes.attributes).toEqual({ mechanics: 90 });
    }
  });

  it("rejects EditPlayer with invalid nested attributes", () => {
    const result = validateProposal({
      version: 2,
      type: "EditPlayer",
      playerId: "lec-player-98767975968177297",
      changes: {
        attributes: { mechanics: 0, shotcalling: 100 },
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "changes.attributes.mechanics", message: "Rating must be an integer from 1 to 99." },
        { field: "changes.attributes.shotcalling", message: "Rating must be an integer from 1 to 99." },
      ]);
    }
  });

  it("rejects EditPlayer with malformed attributes container", () => {
    const result = validateProposal({
      version: 2,
      type: "EditPlayer",
      playerId: "lec-player-98767975968177297",
      changes: {
        match_name: "CAPS",
        attributes: "invalid",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "changes.attributes", message: "Attributes must be an object." },
      ]);
    }
  });

  it("rejects TransferPlayer with missing references and same-team transfer", () => {
    const missingResult = validateProposal({
      version: 2,
      type: "TransferPlayer",
      playerId: "player-missing",
      fromTeamId: "team-missing",
      toTeamId: "team-missing",
      competitionId: "competition-missing",
      wageOffered: 100000,
      fee: 50000,
      contractEnd: "2026-12-31",
    });

    expect(missingResult.ok).toBe(false);
    if (!missingResult.ok) {
      expect(missingResult.errors).toEqual([
        { field: "playerId", message: "Player does not exist." },
        { field: "fromTeamId", message: "Source team does not exist." },
        { field: "toTeamId", message: "Destination team does not exist." },
        { field: "competitionId", message: "Competition does not exist." },
      ]);
    }

    const sameTeamResult = validateProposal({
      version: 2,
      type: "TransferPlayer",
      playerId: "lec-player-98767975968177297",
      fromTeamId: "lec-g2-esports",
      toTeamId: "lec-g2-esports",
      competitionId: "lec",
      wageOffered: 100000,
      fee: 50000,
      contractEnd: "2026-12-31",
    });

    expect(sameTeamResult.ok).toBe(false);
    if (!sameTeamResult.ok) {
      expect(sameTeamResult.errors).toEqual([
        { field: "toTeamId", message: "Destination team must differ from source team." },
      ]);
    }
  });

  it("accepts AddStaff, EditStaff, ReleaseStaff, and EditTeam proposals", () => {
    const addStaff = validateProposal({
      version: 2,
      type: "AddStaff",
      staff: {
        first_name: "New",
        last_name: "Coach",
        role: "HeadCoach",
        team_id: "lec-g2-esports",
        nationality: "ES",
        wage: 50000,
        attributes: { coaching: 70, physiotherapy: 60, judging_ability: 65, judging_potential: 65 },
        contract_end: "2026-12-31",
        date_of_birth: "1980-01-01",
      },
    });
    expect(addStaff.ok).toBe(true);

    const editStaff = validateProposal({
      version: 2,
      type: "EditStaff",
      staffId: "staff-e0e79a66",
      changes: { wage: 60000, attributes: { coaching: 80 } },
    });
    expect(editStaff.ok).toBe(true);

    const releaseStaff = validateProposal({
      version: 2,
      type: "ReleaseStaff",
      staffId: "staff-e0e79a66",
      reason: "mutual",
      severance: 10000,
    });
    expect(releaseStaff.ok).toBe(true);

    const editTeam = validateProposal({
      version: 2,
      type: "EditTeam",
      teamId: "lec-g2-esports",
      changes: { wage_budget: 3000000, training_focus: "Champions" },
    });
    expect(editTeam.ok).toBe(true);
  });

  it("rejects EditStaff with malformed attributes container", () => {
    const result = validateProposal({
      version: 2,
      type: "EditStaff",
      staffId: "staff-e0e79a66",
      changes: {
        wage: 60000,
        attributes: "invalid",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        { field: "changes.attributes", message: "Attributes must be an object." },
      ]);
    }
  });

  it("accepts valid PR3 proposal types", () => {
    const editCompetition = validateProposal({
      version: 2,
      type: "EditCompetition",
      competitionId: "lec",
      changes: { name: "LEC 2026" },
    });
    expect(editCompetition.ok).toBe(true);

    const addSocialAccount = validateProposal({
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
    expect(addSocialAccount.ok).toBe(true);

    const editSocialTemplate = validateProposal({
      version: 2,
      type: "EditSocialTemplate",
      templateId: "team-banter-en-1",
      changes: { weight: 7 },
    });
    expect(editSocialTemplate.ok).toBe(true);

    const addNewsTemplate = validateProposal({
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        body: "Test body {team}.",
        sources: [{ key: "be.source.test", text: "Test Source" }],
      },
    });
    expect(addNewsTemplate.ok).toBe(true);
  });

  it("rejects EditSocialTemplate with no visible change", () => {
    const nullConditionsResult = validateProposal({
      version: 2,
      type: "EditSocialTemplate",
      templateId: "team-banter-en-1",
      changes: { conditions_json: null },
    });

    expect(nullConditionsResult.ok).toBe(false);
    if (!nullConditionsResult.ok) {
      expect(nullConditionsResult.errors).toContainEqual({
        field: "changes",
        message: "At least one change is required.",
      });
    }

    const blankConditionsResult = validateProposal({
      version: 2,
      type: "EditSocialTemplate",
      templateId: "team-banter-en-1",
      changes: { conditions_json: "" },
    });

    expect(blankConditionsResult.ok).toBe(false);
    if (!blankConditionsResult.ok) {
      expect(blankConditionsResult.errors).toContainEqual({
        field: "changes",
        message: "At least one change is required.",
      });
    }
  });

  it("accepts AddNewsTemplate with body_variants instead of body", () => {
    const result = validateProposal({
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        body_variants: [{ body_key: "be.news.test.body", text: "Test variant {team}." }],
        sources: [{ key: "be.source.test", text: "Test Source" }],
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok && result.value.type === "AddNewsTemplate") {
      expect(result.value.template.body).toBeUndefined();
      expect(result.value.template.body_variants).toEqual([
        { body_key: "be.news.test.body", text: "Test variant {team}." },
      ]);
    }
  });

  it("rejects AddNewsTemplate when both body and body_variants are missing", () => {
    const result = validateProposal({
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        sources: [{ key: "be.source.test", text: "Test Source" }],
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        field: "template.body",
        message: "Body or at least one body variant is required.",
      });
    }
  });

  it("rejects AddSocialAccount with invalid author type and missing team references", () => {
    const result = validateProposal({
      version: 2,
      type: "AddSocialAccount",
      account: {
        language: "en",
        display_name: "New Fan",
        handle: "@newfan",
        author_type: "InvalidType",
        profile_image_url: null,
        favorite_team_ids: ["team-missing"],
        active: true,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toContainEqual({
        field: "account.author_type",
        message: "Must be one of: Team, Player, Fan, Analyst, Journalist, MemeAccount, Manager.",
      });
      expect(result.errors).toContainEqual({
        field: "account.favorite_team_ids[0]",
        message: "Team does not exist.",
      });
    }
  });
});

describe("proposal diffs", () => {
  it("emits changed fields and omits unchanged attributes for EditPlayer", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "EditPlayer",
      playerId: "lec-player-98767975968177297",
      changes: {
        match_name: "CAPS",
        attributes: { mechanics: 90 },
      },
    };

    const diff = buildDiff(proposal);

    expect(diff).toContainEqual({
      field: "changes.match_name",
      before: "Caps",
      after: "CAPS",
      severity: "info",
    });
    expect(diff).toContainEqual({
      field: "changes.attributes.mechanics",
      before: 85,
      after: 90,
      severity: "info",
    });
    expect(diff.some((record) => record.field === "player.ovr")).toBe(true);
  });

  it("shows team change for transfers", () => {
    const proposal: ProposalPayload = {
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

    expect(buildDiff(proposal)).toContainEqual({
      field: "player.team",
      before: "G2 Esports",
      after: "Fnatic",
      severity: "warning",
    });
  });

  it("computes OVR parity for Caps baseline", () => {
    const ovr = calculateLolOvr(validCapsAttributes);
    expect(ovr).toBe(89);
  });

  it("emits competition changes for EditCompetition", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "EditCompetition",
      competitionId: "lec",
      changes: { name: "LEC 2026" },
    };

    expect(buildDiff(proposal)).toContainEqual({
      field: "changes.name",
      before: "LEC",
      after: "LEC 2026",
      severity: "info",
    });
  });

  it("emits social account fields for AddSocialAccount", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "AddSocialAccount",
      account: {
        language: "en",
        display_name: "New Fan",
        handle: "@newfan",
        author_type: "Fan",
        profile_image_url: null,
        favorite_team_ids: [],
        active: true,
      },
    };

    const diff = buildDiff(proposal);
    expect(diff).toContainEqual({
      field: "account.handle",
      before: null,
      after: "@newfan",
      severity: "info",
    });
  });

  it("emits social template changes for EditSocialTemplate", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "EditSocialTemplate",
      templateId: "team-banter-en-1",
      changes: { weight: 7, tags: ["match", "team"] },
    };

    const diff = buildDiff(proposal);
    expect(diff).toContainEqual({
      field: "changes.weight",
      before: 5,
      after: 7,
      severity: "info",
    });
  });

  it("emits news template fields for AddNewsTemplate", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        body: "Test body.",
        sources: [{ key: "be.source.test", text: "Test Source" }],
      },
    };

    const diff = buildDiff(proposal);
    expect(diff).toContainEqual({
      field: "template.category",
      before: null,
      after: "Editorial",
      severity: "info",
    });
  });

  it("emits body_variants diff for AddNewsTemplate when body is absent", () => {
    const proposal: ProposalPayload = {
      version: 2,
      type: "AddNewsTemplate",
      template: {
        category: "Editorial",
        headlines: [{ key: "be.news.test.headline", text: "Test headline" }],
        body_variants: [{ body_key: "be.news.test.body", text: "Test variant {team}." }],
        sources: [{ key: "be.source.test", text: "Test Source" }],
      },
    };

    const diff = buildDiff(proposal);
    expect(diff).toContainEqual({
      field: "template.body_variants",
      before: null,
      after: "be.news.test.body: Test variant {team}.",
      severity: "info",
    });
    expect(diff.some((record) => record.field === "template.body")).toBe(false);
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
  });
});
