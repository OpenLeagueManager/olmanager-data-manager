"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PROPOSAL_TYPE_METADATA } from "@/domain/proposals/metadata";
import type { ProposalId, ProposalPayload, ProposalReview, ProposalType } from "@/domain/proposals/types";
import {
  NON_PRODUCTION_SESSION_STORE_NOTICE,
  ProposalDetail,
  ProposalForm,
  ProposalList,
  ProposalSessionStoreProvider,
  ReviewControls,
  useProposalSessionStore,
  useProposalSessionStoreNotice,
  useProposalSessionStoreReady,
} from "@/features/proposals";
import styles from "./proposal-ui.module.css";

const proposalTypeLinks = Object.values(PROPOSAL_TYPE_METADATA);

export function ProposalsRoute() {
  return (
    <ProposalSessionStoreProvider>
      <ProposalsWorkbench />
    </ProposalSessionStoreProvider>
  );
}

export function NewProposalRoute({ proposalType, initialEntityId }: { proposalType: ProposalType; initialEntityId?: string }) {
  return (
    <ProposalSessionStoreProvider>
      <NewProposalWorkbench proposalType={proposalType} initialEntityId={initialEntityId} />
    </ProposalSessionStoreProvider>
  );
}

export function ProposalDetailRoute({ proposalId }: { proposalId: ProposalId }) {
  return (
    <ProposalSessionStoreProvider>
      <ProposalDetailWorkbench proposalId={proposalId} />
    </ProposalSessionStoreProvider>
  );
}

function ProposalsWorkbench() {
  const { clearSessionProposals, proposals } = useProposalSessionStore();
  const { notice, dismiss } = useProposalSessionStoreNotice();
  const { data: session } = useSession();
  const [githubProposals, setGithubProposals] = useState<Array<{
    number: number; title: string; body: string; url: string; author: string; createdAt: string; labels: string[];
  }>>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<Record<number, "loading" | "ok" | "error">>({});

  const fetchProposals = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        const data = await res.json();
        setGithubProposals(data.proposals ?? []);
      }
    } catch { /* GitHub App not configured */ }
  }, [session]);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  async function handleReview(issueNumber: number, action: "approve" | "reject") {
    setReviewLoading(true);
    setReviewStatus((prev) => ({ ...prev, [issueNumber]: "loading" }));
    try {
      const res = await fetch(`/api/proposals/${issueNumber}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewer: session?.user?.name || "Maintainer",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setReviewStatus((prev) => ({ ...prev, [issueNumber]: "ok" }));
      setGithubProposals((prev) => prev.filter((p) => p.number !== issueNumber));
    } catch {
      setReviewStatus((prev) => ({ ...prev, [issueNumber]: "error" }));
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {notice ? (
        <div className={styles.notice} role="alert">
          <p>{notice}</p>
          <Button onClick={dismiss} size="sm" variant="secondary">
            Dismiss
          </Button>
        </div>
      ) : null}

      <section className={styles.heroPanel} aria-labelledby="proposals-title">
        <p className={styles.eyebrow}>Typed proposal workbench</p>
        <h1 className={styles.title} id="proposals-title">
          Review OLManager data changes before anything ships.
        </h1>
        <p className={styles.lede}>
          Contributors create typed proposals from canonical LoL data. Reviewers inspect
          deterministic diffs and record stub approval or rejection decisions in this browser
          session only.
        </p>
        <MvpExclusions />
      </section>

      {githubProposals.length > 0 ? (
        <section className={styles.contentPanel} aria-labelledby="review-queue-title">
          <div className={`${styles.sectionHeading} ${styles.withActions}`}>
            <div>
              <p className={styles.eyebrow}>Review queue</p>
              <h2 className={styles.sectionTitle} id="review-queue-title">
                Open proposals ({githubProposals.length})
              </h2>
            </div>
            <Button onClick={fetchProposals} size="sm" variant="secondary" disabled={reviewLoading}>
              Refresh
            </Button>
          </div>
          <div className={styles.stack}>
            {githubProposals.map((gh) => (
              <div key={gh.number} className={styles.card}>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        className="font-medium hover:underline"
                        href={gh.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        #{gh.number}
                      </a>
                      {gh.labels.filter((l) => l !== "proposal").map((label) => (
                        <span key={label} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {label}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm">{gh.title}</p>
                    <pre className="mt-2 max-h-48 overflow-y-auto rounded-md bg-muted p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {gh.body}
                    </pre>
                    <p className="text-xs text-muted-foreground">
                      by {gh.author} · {new Date(gh.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {reviewStatus[gh.number] === "ok" ? (
                      <span className="text-sm text-muted-foreground">Done</span>
                    ) : reviewStatus[gh.number] === "error" ? (
                      <span className="text-sm text-destructive">Error</span>
                    ) : session?.user?.isMaintainer ? (
                      <>
                        <Button
                          disabled={reviewLoading}
                          onClick={() => handleReview(gh.number, "approve")}
                          size="sm"
                          variant="primary"
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={reviewLoading}
                          onClick={() => handleReview(gh.number, "reject")}
                          size="sm"
                          variant="secondary"
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting review</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.contentPanel} aria-labelledby="create-title">
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>Create</p>
          <h2 className={styles.sectionTitle} id="create-title">
            Choose a supported proposal type
          </h2>
        </div>
        <div className={styles.choiceGrid}>
          {proposalTypeLinks.map((proposalType) => (
            <Link className={styles.choiceCard} href={proposalType.href} key={proposalType.href}>
              <span className={styles.choiceTitle}>{proposalType.label}</span>
              <small className={styles.choiceDescription}>{proposalType.description}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.contentPanel} aria-labelledby="session-proposals-title">
        <div className={`${styles.sectionHeading} ${styles.withActions}`}>
          <div>
            <p className={styles.eyebrow}>Session review queue</p>
            <h2 className={styles.sectionTitle} id="session-proposals-title">
              Current proposals
            </h2>
          </div>
          {proposals.length > 0 ? (
            <Button onClick={clearSessionProposals} type="button" variant="secondary">
              Clear session proposals
            </Button>
          ) : null}
        </div>
        <ProposalList proposals={proposals} />
      </section>
    </div>
  );
}

function NewProposalWorkbench({ proposalType, initialEntityId }: { proposalType: ProposalType; initialEntityId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addDraft } = useProposalSessionStore();
  const [githubStatus, setGithubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [issueUrl, setIssueUrl] = useState<string | null>(null);

  async function handleProposalAccepted(payload: ProposalPayload) {
    if (session?.user) {
      // GitHub-backed: create issue
      setGithubStatus("loading");
      try {
        const res = await fetch("/api/proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload,
            author: session.user.name || session.user.id,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create proposal");
        }

        const data = await res.json();
        setIssueUrl(data.issueUrl);
        setGithubStatus("success");
      } catch {
        setGithubStatus("error");
      }
    } else {
      // Fallback: session-only
      const proposal = addDraft(payload);
      router.push(`/proposals/${proposal.id}`);
    }
  }

  return (
    <div className={`${styles.page} ${styles.narrowPage}`}>
      <section className={styles.contentPanel} aria-labelledby="new-proposal-title">
        <Link className={styles.textLink} href="/proposals">
          Back to proposal queue
        </Link>
        <div className={styles.sectionHeading}>
          <p className={styles.eyebrow}>New proposal</p>
          <h1 className={styles.title} id="new-proposal-title">
            Create a validated draft
          </h1>
          <p className={`${styles.lede} ${styles.compactLede}`}>
            The form uses native constraints for guidance, then validates through the typed domain
            rules before creating a reviewable draft.
          </p>
        </div>

        {githubStatus === "success" && issueUrl ? (
          <div className={styles.card}>
            <p className={styles.notice}>
              ✅ Proposal created as{" "}
              <a
                className={styles.textLink}
                href={issueUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub Issue
              </a>
              .
            </p>
            <div className={styles.buttonRow}>
              <Button onClick={() => { setGithubStatus("idle"); setIssueUrl(null); }} type="button">
                Create another
              </Button>
              <Button
                onClick={() => router.push("/proposals")}
                type="button"
                variant="secondary"
              >
                Back to proposals
              </Button>
            </div>
          </div>
        ) : githubStatus === "error" ? (
          <div className={styles.card}>
            <p className={styles.notice}>
              ⚠️ Failed to create GitHub Issue. Check that the GitHub App is configured.
            </p>
            <Button onClick={() => setGithubStatus("idle")} type="button" variant="secondary">
              Try again
            </Button>
          </div>
        ) : (
          <ProposalForm
            onProposalAccepted={handleProposalAccepted}
            proposalType={proposalType}
            initialEntityId={initialEntityId}
          />
        )}

        {githubStatus === "loading" ? (
          <p className={styles.notice}>Creating GitHub Issue…</p>
        ) : null}
      </section>
    </div>
  );
}

function ProposalDetailWorkbench({ proposalId }: { proposalId: ProposalId }) {
  const { applyReviewAction, getProposal, submitDraft } = useProposalSessionStore();
  const isSessionStoreReady = useProposalSessionStoreReady();
  const proposal = getProposal(proposalId);

  if (!isSessionStoreReady) {
    return (
      <div className={`${styles.page} ${styles.narrowPage}`}>
        <section className={styles.contentPanel} aria-labelledby="loading-proposal-title">
          <Link className={styles.textLink} href="/proposals">
            Back to proposal queue
          </Link>
          <h1 className={styles.title} id="loading-proposal-title">
            Loading session proposal
          </h1>
          <p className={`${styles.lede} ${styles.compactLede}`}>
            Checking this browser session for stored proposal state.
          </p>
        </section>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className={`${styles.page} ${styles.narrowPage}`}>
        <section className={styles.contentPanel} aria-labelledby="missing-proposal-title">
          <Link className={styles.textLink} href="/proposals">
            Back to proposal queue
          </Link>
          <h1 className={styles.title} id="missing-proposal-title">
            Proposal not found in this session
          </h1>
          <p className={`${styles.lede} ${styles.compactLede}`}>
            {NON_PRODUCTION_SESSION_STORE_NOTICE} Open the queue in the same browser session, or
            create a new data-backed proposal.
          </p>
        </section>
      </div>
    );
  }

  const currentProposalId = proposal.id;

  function handleReviewChange(review: ProposalReview) {
    if (review.state === "approved" && review.reviewer) {
      applyReviewAction(currentProposalId, { type: "approve", reviewer: review.reviewer });
    }

    if (review.state === "rejected" && review.reviewer) {
      applyReviewAction(currentProposalId, {
        type: "reject",
        reviewer: review.reviewer,
        reason: review.rejectionReason ?? "",
      });
    }
  }

  return (
    <div className={`${styles.page} ${styles.narrowPage}`}>
      <Link className={styles.textLink} href="/proposals">
        Back to proposal queue
      </Link>
      <ProposalDetail proposal={proposal} />
      {proposal.review.state === "draft" ? (
        <section className={styles.card} aria-labelledby="submit-draft-title">
          <h2 id="submit-draft-title">Submit draft for review</h2>
          <p className={styles.notice}>
            Submitting changes only this session-backed MVP state. It does not create GitHub
            branches, commits, pull requests, production records, assets, or ZIP files.
          </p>
          <div className={styles.buttonRow}>
            <Button onClick={() => submitDraft(proposal.id)} type="button">
              Submit draft for review
            </Button>
          </div>
        </section>
      ) : null}
      <ReviewControls onReviewChange={handleReviewChange} review={proposal.review} />
    </div>
  );
}

function MvpExclusions() {
  return (
    <aside className={styles.mvpBoundary} aria-label="MVP exclusions">
      <strong>MVP boundary:</strong> no Discord OAuth or role sync, no GitHub writes, no
      production persistence, no asset uploads, and no ZIP export generation.
    </aside>
  );
}
