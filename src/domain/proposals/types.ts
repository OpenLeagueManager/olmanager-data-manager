

import type {
  CompetitionManifest,
  NewPlayerInput,
  NewStaffInput,
  NewsTemplate,
  Player,
  PlayerAttributes,
  SocialAccountData,
  SocialTemplateData,
  Staff,
  StaffAttributes,
  Team,
} from "@/data/olmanager/types";

export type ProposalId = `proposal-${string}`;
export type PlayerId = string;
export type TeamId = string;
export type CompetitionId = string;
export type StaffId = string;

export type ProposalType =
  | "AddPlayer"
  | "EditPlayer"
  | "TransferPlayer"
  | "AddStaff"
  | "EditStaff"
  | "ReleaseStaff"
  | "EditTeam"
  | "EditCompetition"
  | "AddSocialAccount"
  | "EditSocialTemplate"
  | "AddNewsTemplate";

export type AddPlayerPayload = {
  version: 2;
  type: "AddPlayer";
  player: NewPlayerInput;
};

export type EditPlayerPayload = {
  version: 2;
  type: "EditPlayer";
  playerId: PlayerId;
  changes: Partial<
    Pick<
      Player,
      | "full_name"
      | "match_name"
      | "position"
      | "nationality"
      | "wage"
      | "market_value"
      | "contract_end"
      | "transfer_listed"
      | "loan_listed"
    >
  > & {
    attributes?: Partial<PlayerAttributes>;
  };
};

export type TransferPlayerPayload = {
  version: 2;
  type: "TransferPlayer";
  playerId: PlayerId;
  fromTeamId: TeamId;
  toTeamId: TeamId;
  competitionId: CompetitionId;
  wageOffered: number;
  fee: number;
  contractEnd: string;
};

export type AddStaffPayload = {
  version: 2;
  type: "AddStaff";
  staff: NewStaffInput;
};

export type EditStaffPayload = {
  version: 2;
  type: "EditStaff";
  staffId: StaffId;
  changes: Partial<Pick<Staff, "role" | "wage" | "contract_end">> & {
    attributes?: Partial<StaffAttributes>;
  };
};

export type ReleaseStaffPayload = {
  version: 2;
  type: "ReleaseStaff";
  staffId: StaffId;
  reason: "fired" | "resigned" | "contract_end" | "mutual";
  severance?: number;
};

export type EditTeamPayload = {
  version: 2;
  type: "EditTeam";
  teamId: TeamId;
  changes: Partial<
    Pick<
      Team,
      | "name"
      | "short_name"
      | "wage_budget"
      | "transfer_budget"
      | "training_focus"
      | "training_intensity"
    >
  >;
};

export type EditCompetitionPayload = {
  version: 2;
  type: "EditCompetition";
  competitionId: CompetitionId;
  changes: Partial<Pick<CompetitionManifest, "name" | "full_name" | "logo" | "tier" | "active">>;
};

export type AddSocialAccountPayload = {
  version: 2;
  type: "AddSocialAccount";
  account: Omit<SocialAccountData, "id">;
};

export type EditSocialTemplatePayload = {
  version: 2;
  type: "EditSocialTemplate";
  templateId: string;
  changes: Partial<Pick<SocialTemplateData, "weight" | "variants" | "tags" | "active" | "conditions_json">>;
};

export type AddNewsTemplatePayload = {
  version: 2;
  type: "AddNewsTemplate";
  template: Omit<NewsTemplate, "id">;
};

export type V2ProposalPayload =
  | AddPlayerPayload
  | EditPlayerPayload
  | TransferPlayerPayload
  | AddStaffPayload
  | EditStaffPayload
  | ReleaseStaffPayload
  | EditTeamPayload
  | EditCompetitionPayload
  | AddSocialAccountPayload
  | EditSocialTemplatePayload
  | AddNewsTemplatePayload;

export type ProposalPayload = V2ProposalPayload;

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
