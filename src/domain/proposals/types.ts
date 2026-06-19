export type ProposalId = `proposal-${string}`;
export type PlayerId = string;
export type TeamId = string;
export type CompetitionId = string;

export type ProposalType =
  | "AddPlayer"
  | "EditPlayerAttributes"
  | "TransferPlayer";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type AddPlayerPayload = {
  type: "AddPlayer";
  player: {
    id: PlayerId;
    name: string;
    position: PlayerPosition;
    teamId: TeamId;
    competitionId: CompetitionId;
    overall: number;
  };
};

export type EditablePlayerAttributes = {
  name?: string;
  position?: PlayerPosition;
  overall?: number;
};

export type EditPlayerAttributesPayload = {
  type: "EditPlayerAttributes";
  playerId: PlayerId;
  attributes: EditablePlayerAttributes;
};

export type TransferPlayerPayload = {
  type: "TransferPlayer";
  playerId: PlayerId;
  fromTeamId: TeamId;
  toTeamId: TeamId;
  competitionId: CompetitionId;
};

export type ProposalPayload =
  | AddPlayerPayload
  | EditPlayerAttributesPayload
  | TransferPlayerPayload;

export type FieldError = {
  field: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: FieldError[] };

export type DiffSeverity = "info" | "warning";

export type DiffRecord = {
  field: string;
  before: unknown;
  after: unknown;
  severity: DiffSeverity;
};

export type ReviewState = "draft" | "submitted" | "approved" | "rejected";

export type ReviewerMetadata = {
  reviewerId: string;
  displayName: string;
  reviewedAt: string;
  identityModel: "stub";
};

export type ProposalReview = {
  state: ReviewState;
  reviewer?: ReviewerMetadata;
  rejectionReason?: string;
};
