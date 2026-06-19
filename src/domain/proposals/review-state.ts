import type {
  ProposalReview,
  ReviewState,
  ReviewerMetadata,
  ValidationResult,
} from "./types";

export type ReviewAction =
  | { type: "submit" }
  | { type: "approve"; reviewer: ReviewerMetadata }
  | { type: "reject"; reviewer: ReviewerMetadata; reason: string };

const allowedTransitions: Record<ReviewState, readonly ReviewAction["type"][]> = {
  draft: ["submit"],
  submitted: ["approve", "reject"],
  approved: [],
  rejected: [],
};

export function transitionReviewState(
  current: ProposalReview,
  action: ReviewAction,
): ValidationResult<ProposalReview> {
  if (!allowedTransitions[current.state].includes(action.type)) {
    return {
      ok: false,
      errors: [
        {
          field: "state",
          message: `Cannot ${action.type} a proposal in ${current.state} state.`,
        },
      ],
    };
  }

  switch (action.type) {
    case "submit":
      return { ok: true, value: { state: "submitted" } };
    case "approve":
      return {
        ok: true,
        value: { state: "approved", reviewer: action.reviewer },
      };
    case "reject": {
      const reason = action.reason.trim();
      if (reason.length === 0) {
        return {
          ok: false,
          errors: [{ field: "rejectionReason", message: "Rejection reason is required." }],
        };
      }

      return {
        ok: true,
        value: {
          state: "rejected",
          reviewer: action.reviewer,
          rejectionReason: reason,
        },
      };
    }
  }
}
