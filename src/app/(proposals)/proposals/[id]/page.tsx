import type { Metadata } from "next";
import type { ProposalId } from "@/domain/proposals/types";
import { ProposalDetailRoute } from "@/features/proposals/proposal-routes";

export const metadata: Metadata = {
  title: "Proposal review | OLManager Data Manager",
  description: "Inspect deterministic proposal diffs and record stub MVP review decisions.",
};

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProposalDetailRoute proposalId={id as ProposalId} />;
}
