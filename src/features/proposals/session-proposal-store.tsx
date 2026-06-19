"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { buildProposalDiff } from "@/domain/proposals/diff";
import { transitionReviewState, type ReviewAction } from "@/domain/proposals/review-state";
import type {
  DiffRecord,
  ProposalId,
  ProposalPayload,
  ProposalReview,
  ReviewerMetadata,
  ValidationResult,
} from "@/domain/proposals/types";
import { validateProposal } from "@/domain/proposals/validation";

export const NON_PRODUCTION_SESSION_STORE_NOTICE =
  "Non-production session adapter: proposals stay in this browser tab session and are never persisted to production storage.";

export const SESSION_PROPOSALS_STORAGE_KEY =
  "olmanager.typed-proposals.non-production-session.v1";

const SESSION_PROPOSALS_CHANGED_EVENT = "olmanager:session-proposals-changed";

export type SessionProposal = {
  id: ProposalId;
  payload: ProposalPayload;
  review: ProposalReview;
  diff: DiffRecord[];
  createdAt: string;
  updatedAt: string;
};

type ProposalSessionStore = {
  proposals: SessionProposal[];
  isReady: boolean;
  addDraft: (payload: ProposalPayload) => SessionProposal;
  submitDraft: (proposalId: ProposalId) => ValidationResult<SessionProposal>;
  applyReviewAction: (
    proposalId: ProposalId,
    action: ReviewAction,
  ) => ValidationResult<SessionProposal>;
  getProposal: (proposalId: ProposalId) => SessionProposal | undefined;
  clearSessionProposals: () => void;
};

const ProposalSessionStoreContext = createContext<ProposalSessionStore | null>(null);

export function ProposalSessionStoreProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeSessionProposals,
    readBrowserSessionSnapshot,
    readServerSessionSnapshot,
  );
  const isReady = snapshot !== null;
  const proposals = useMemo(() => readSessionProposalsFromSnapshot(snapshot), [snapshot]);

  useEffect(() => {
    if (!isReady || snapshot === JSON.stringify(proposals)) {
      return;
    }

    writeSessionProposals(proposals);
  }, [isReady, proposals, snapshot]);

  const addDraft = useCallback((payload: ProposalPayload) => {
    const now = new Date().toISOString();
    const proposal: SessionProposal = {
      id: createProposalId(),
      payload,
      review: { state: "draft" },
      diff: buildProposalDiff(payload),
      createdAt: now,
      updatedAt: now,
    };

    writeSessionProposals([proposal, ...proposals]);
    return proposal;
  }, [proposals]);

  const replaceProposal = useCallback((updated: SessionProposal) => {
    writeSessionProposals(
      proposals.map((proposal) => (proposal.id === updated.id ? updated : proposal)),
    );
    return updated;
  }, [proposals]);

  const submitDraft = useCallback(
    (proposalId: ProposalId): ValidationResult<SessionProposal> => {
      const proposal = proposals.find((candidate) => candidate.id === proposalId);
      if (!proposal) {
        return missingProposalResult();
      }

      const result = transitionReviewState(proposal.review, { type: "submit" });
      if (!result.ok) {
        return result;
      }

      const updated = replaceProposal({
        ...proposal,
        review: result.value,
        updatedAt: new Date().toISOString(),
      });
      return { ok: true, value: updated };
    },
    [proposals, replaceProposal],
  );

  const applyReviewAction = useCallback(
    (proposalId: ProposalId, action: ReviewAction): ValidationResult<SessionProposal> => {
      const proposal = proposals.find((candidate) => candidate.id === proposalId);
      if (!proposal) {
        return missingProposalResult();
      }

      const result = transitionReviewState(proposal.review, action);
      if (!result.ok) {
        return result;
      }

      const updated = replaceProposal({
        ...proposal,
        review: result.value,
        updatedAt: new Date().toISOString(),
      });
      return { ok: true, value: updated };
    },
    [proposals, replaceProposal],
  );

  const getProposal = useCallback(
    (proposalId: ProposalId) => proposals.find((proposal) => proposal.id === proposalId),
    [proposals],
  );

  const clearSessionProposals = useCallback(() => {
    writeSessionProposals([]);
  }, []);

  const value = useMemo<ProposalSessionStore>(
    () => ({
      proposals,
      isReady,
      addDraft,
      submitDraft,
      applyReviewAction,
      getProposal,
      clearSessionProposals,
    }),
    [addDraft, applyReviewAction, clearSessionProposals, getProposal, isReady, proposals, submitDraft],
  );

  return (
    <ProposalSessionStoreContext.Provider value={value}>
      {children}
    </ProposalSessionStoreContext.Provider>
  );
}

export function useProposalSessionStore() {
  const store = useContext(ProposalSessionStoreContext);
  if (!store) {
    throw new Error("useProposalSessionStore must be used inside ProposalSessionStoreProvider.");
  }

  return store;
}

export function useProposalSessionStoreReady() {
  return useProposalSessionStore().isReady;
}

function readSessionProposalsFromSnapshot(rawValue: string | null): SessionProposal[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((candidate) => {
      const result = normalizeSessionProposal(candidate);
      return result.ok ? [result.value] : [];
    });
  } catch {
    return [];
  }
}

function subscribeSessionProposals(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SESSION_PROPOSALS_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SESSION_PROPOSALS_CHANGED_EVENT, onStoreChange);
  };
}

function readBrowserSessionSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(SESSION_PROPOSALS_STORAGE_KEY) ?? "[]";
}

function readServerSessionSnapshot() {
  return null;
}

function writeSessionProposals(proposals: SessionProposal[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SESSION_PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
  window.dispatchEvent(new Event(SESSION_PROPOSALS_CHANGED_EVENT));
}

function normalizeSessionProposal(candidate: unknown): ValidationResult<SessionProposal> {
  if (!isRecord(candidate)) {
    return fieldFailure("proposal", "Stored proposal must be an object.");
  }

  const id = readProposalId(candidate.id);
  const payload = validateProposal(candidate.payload);
  const review = normalizeReview(candidate.review);
  const createdAt = readIsoDate(candidate.createdAt);
  const updatedAt = readIsoDate(candidate.updatedAt);

  if (!id || !payload.ok || !review.ok || !createdAt || !updatedAt) {
    return fieldFailure("proposal", "Stored proposal has an unsupported session shape.");
  }

  return {
    ok: true,
    value: {
      id,
      payload: payload.value,
      review: review.value,
      diff: buildProposalDiff(payload.value),
      createdAt,
      updatedAt,
    },
  };
}

function normalizeReview(candidate: unknown): ValidationResult<ProposalReview> {
  if (!isRecord(candidate) || !isReviewState(candidate.state)) {
    return fieldFailure("review", "Stored proposal review has an unsupported state.");
  }

  const reviewer = normalizeReviewer(candidate.reviewer);
  if (!reviewer.ok) {
    return reviewer;
  }

  if ((candidate.state === "approved" || candidate.state === "rejected") && !reviewer.value) {
    return fieldFailure("review.reviewer", "Approved or rejected proposals need reviewer metadata.");
  }

  if (candidate.state === "rejected") {
    if (typeof candidate.rejectionReason !== "string" || candidate.rejectionReason.trim() === "") {
      return fieldFailure("review.rejectionReason", "Rejected proposals need a reason.");
    }

    return {
      ok: true,
      value: {
        state: candidate.state,
        reviewer: reviewer.value,
        rejectionReason: candidate.rejectionReason.trim(),
      },
    };
  }

  return {
    ok: true,
    value: {
      state: candidate.state,
      reviewer: reviewer.ok ? reviewer.value : undefined,
    },
  };
}

function normalizeReviewer(candidate: unknown): ValidationResult<ReviewerMetadata | undefined> {
  if (candidate === undefined) {
    return { ok: true, value: undefined };
  }

  if (!isRecord(candidate)) {
    return fieldFailure("review.reviewer", "Stored reviewer metadata must be an object.");
  }

  const reviewedAt = readIsoDate(candidate.reviewedAt);
  if (
    typeof candidate.reviewerId !== "string" ||
    candidate.reviewerId.trim() === "" ||
    typeof candidate.displayName !== "string" ||
    candidate.displayName.trim() === "" ||
    candidate.identityModel !== "stub" ||
    !reviewedAt
  ) {
    return fieldFailure("review.reviewer", "Stored reviewer metadata is invalid.");
  }

  return {
    ok: true,
    value: {
      reviewerId: candidate.reviewerId.trim(),
      displayName: candidate.displayName.trim(),
      identityModel: "stub",
      reviewedAt,
    },
  };
}

function readProposalId(value: unknown): ProposalId | undefined {
  return typeof value === "string" && value.startsWith("proposal-")
    ? (value as ProposalId)
    : undefined;
}

function readIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const time = Date.parse(value);
  return Number.isFinite(time) ? value : undefined;
}

function isReviewState(value: unknown): value is ProposalReview["state"] {
  return value === "draft" || value === "submitted" || value === "approved" || value === "rejected";
}

function fieldFailure(field: string, message: string): ValidationResult<never> {
  return { ok: false, errors: [{ field, message }] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createProposalId(): ProposalId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `proposal-${crypto.randomUUID()}`;
  }

  return `proposal-${Date.now().toString(36)}`;
}

function missingProposalResult(): ValidationResult<never> {
  return {
    ok: false,
    errors: [{ field: "proposalId", message: "Proposal was not found in the session store." }],
  };
}
