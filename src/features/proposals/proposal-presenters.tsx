import type { DiffRecord, ProposalPayload, ProposalReview } from "@/domain/proposals/types";
import Link from "next/link";
import type { SessionProposal } from "./session-proposal-store";
import { NON_PRODUCTION_SESSION_STORE_NOTICE } from "./session-proposal-store";
import styles from "./proposal-ui.module.css";

export function ProposalList({ proposals }: { proposals: readonly SessionProposal[] }) {
  if (proposals.length === 0) {
    return (
      <section className={styles.card} aria-label="Proposal list">
        <p>No session proposals yet.</p>
        <p className={styles.metadata}>{NON_PRODUCTION_SESSION_STORE_NOTICE}</p>
      </section>
    );
  }

  return (
    <section className={styles.stack} aria-label="Proposal list">
      <p className={styles.notice}>{NON_PRODUCTION_SESSION_STORE_NOTICE}</p>
      {proposals.map((proposal) => (
        <article className={styles.card} key={proposal.id}>
          <header>
            <h2>{proposalTitle(proposal.payload)}</h2>
            <ReviewStatus review={proposal.review} />
          </header>
          <p className={styles.metadata}>Proposal ID: {proposal.id}</p>
          <p className={styles.metadata}>Updated: {formatDate(proposal.updatedAt)}</p>
          <Link className={styles.inlineLink} href={`/proposals/${proposal.id}`}>
            Open review details
          </Link>
        </article>
      ))}
    </section>
  );
}

export function ProposalDetail({ proposal }: { proposal: SessionProposal }) {
  return (
    <article className={styles.stack} aria-labelledby={`${proposal.id}-title`}>
      <section className={styles.card}>
        <p className={styles.notice}>{NON_PRODUCTION_SESSION_STORE_NOTICE}</p>
        <h1 id={`${proposal.id}-title`}>{proposalTitle(proposal.payload)}</h1>
        <ReviewStatus review={proposal.review} />
        <p className={styles.metadata}>Proposal ID: {proposal.id}</p>
        <p className={styles.metadata}>Created: {formatDate(proposal.createdAt)}</p>
      </section>
      <section className={styles.card} aria-labelledby={`${proposal.id}-diff-title`}>
        <h2 id={`${proposal.id}-diff-title`}>Review diff</h2>
        <ProposalDiff diff={proposal.diff} />
      </section>
      {proposal.review.state === "rejected" && proposal.review.rejectionReason ? (
        <section className={styles.card} aria-labelledby={`${proposal.id}-rejection-title`}>
          <h2 id={`${proposal.id}-rejection-title`}>Rejection reason</h2>
          <p>{proposal.review.rejectionReason}</p>
        </section>
      ) : null}
    </article>
  );
}

export function ProposalDiff({ diff }: { diff: readonly DiffRecord[] }) {
  if (diff.length === 0) {
    return <p>No changed fields.</p>;
  }

  return (
    <ul className={styles.diffList}>
      {diff.map((record) => (
        <li
          className={`${styles.diffItem} ${record.severity === "warning" ? styles.diffWarning : ""}`}
          key={`${record.field}-${String(record.before)}-${String(record.after)}`}
        >
          <strong>{record.field}</strong>: <Value value={record.before} /> →{" "}
          <Value value={record.after} />
        </li>
      ))}
    </ul>
  );
}

export function ReviewStatus({ review }: { review: ProposalReview }) {
  const statusClass = {
    approved: styles.statusApproved,
    draft: styles.statusDraft,
    rejected: styles.statusRejected,
    submitted: styles.statusSubmitted,
  }[review.state];

  return (
    <div className={styles.stack}>
      <span className={`${styles.status} ${statusClass}`}>{review.state}</span>
      {review.reviewer ? (
        <p className={styles.metadata}>
          Reviewed by {review.reviewer.displayName} using non-production stub identity at{" "}
          {formatDate(review.reviewer.reviewedAt)}.
        </p>
      ) : null}
    </div>
  );
}

function Value({ value }: { value: unknown }) {
  if (value === null) {
    return <em>None</em>;
  }

  return <span>{String(value)}</span>;
}

function proposalTitle(payload: ProposalPayload) {
  switch (payload.type) {
    case "AddPlayer":
      return `Add ${payload.player.match_name}`;
    case "EditPlayer":
      return `Edit ${payload.playerId}`;
    case "TransferPlayer":
      return `Transfer ${payload.playerId}`;
    case "AddStaff":
      return `Add ${payload.staff.first_name} ${payload.staff.last_name}`;
    case "EditStaff":
      return `Edit ${payload.staffId}`;
    case "ReleaseStaff":
      return `Release ${payload.staffId}`;
    case "EditTeam":
      return `Edit ${payload.teamId}`;
    case "EditCompetition":
      return `Edit ${payload.competitionId}`;
    case "AddSocialAccount":
      return `Add ${payload.account.handle}`;
    case "EditSocialTemplate":
      return `Edit ${payload.templateId}`;
    case "AddNewsTemplate":
      return `Add ${payload.template.category} news template`;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
