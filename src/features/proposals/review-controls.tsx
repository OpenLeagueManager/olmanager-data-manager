"use client";

import { useState, type FormEvent } from "react";
import { transitionReviewState } from "@/domain/proposals/review-state";
import type { FieldError, ProposalReview, ReviewerMetadata } from "@/domain/proposals/types";
import styles from "./proposal-ui.module.css";

const stubReviewer: Omit<ReviewerMetadata, "reviewedAt"> = {
  reviewerId: "stub-reviewer",
  displayName: "Stub Reviewer",
  identityModel: "stub",
};

type ReviewControlsProps = {
  review: ProposalReview;
  onReviewChange: (review: ProposalReview) => void;
};

export function ReviewControls({ review, onReviewChange }: ReviewControlsProps) {
  const [errors, setErrors] = useState<FieldError[]>([]);

  function handleApprove() {
    applyReview({ state: review.state }, "approve");
  }

  function handleReject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("rejectionReason") ?? "");
    applyReview({ state: review.state }, "reject", reason);
  }

  function handleRejectionReasonInput(event: FormEvent<HTMLTextAreaElement>) {
    const reason = event.currentTarget.value;

    setErrors((current) => {
      const hasRejectionReasonError = current.some((error) => error.field === "rejectionReason");
      if (!hasRejectionReasonError || reason.trim() === "") {
        return current;
      }

      return current.filter((error) => error.field !== "rejectionReason");
    });
  }

  function applyReview(
    current: ProposalReview,
    action: "approve" | "reject",
    rejectionReason?: string,
  ) {
    const reviewer = createStubReviewer();
    const result = transitionReviewState(
      current,
      action === "approve"
        ? { type: "approve", reviewer }
        : { type: "reject", reviewer, reason: rejectionReason ?? "" },
    );

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    onReviewChange(result.value);
  }

  if (review.state !== "submitted") {
    return (
      <section className={styles.card} aria-label="Review controls">
        <p>Review actions are available only for submitted proposals.</p>
      </section>
    );
  }

  const rejectionError = errors.find((error) => error.field === "rejectionReason")?.message;

  return (
    <section className={styles.card} aria-labelledby="review-controls-title">
      <h2 id="review-controls-title">Review controls</h2>
      <p className={styles.notice}>
        Reviewer identity is a non-production stub. These controls do not use Discord OAuth,
        roles, GitHub writes, production persistence, asset uploads, or ZIP export.
      </p>
      <div className={styles.buttonRow}>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={handleApprove}
          type="button"
        >
          Approve with stub reviewer
        </button>
      </div>
      <form className={styles.stack} noValidate onSubmit={handleReject}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rejection-reason">
            Rejection reason
          </label>
          <textarea
            aria-describedby={rejectionError ? "rejection-reason-error" : undefined}
            aria-errormessage="rejection-reason-error"
            aria-invalid={rejectionError ? "true" : undefined}
            className={styles.control}
            id="rejection-reason"
            name="rejectionReason"
            onInput={handleRejectionReasonInput}
            required
            rows={3}
          />
          <span
            className={styles.fieldError}
            data-visible={Boolean(rejectionError)}
            id="rejection-reason-error"
            role={rejectionError ? "alert" : undefined}
          >
            {rejectionError ?? "A rejection reason is required."}
          </span>
        </div>
        <div className={styles.buttonRow}>
          <button className={`${styles.button} ${styles.dangerButton}`} type="submit">
            Reject with stub reviewer
          </button>
        </div>
      </form>
    </section>
  );
}

function createStubReviewer(): ReviewerMetadata {
  return {
    ...stubReviewer,
    reviewedAt: new Date().toISOString(),
  };
}
