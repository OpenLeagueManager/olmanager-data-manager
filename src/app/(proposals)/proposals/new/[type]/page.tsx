import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseProposalType } from "@/domain/proposals/validation";
import { NewProposalRoute } from "@/features/proposals/proposal-routes";

export const metadata: Metadata = {
  title: "New proposal | OLManager Data Manager",
  description: "Create a typed, canonical-data-backed OLManager data proposal.",
};

export default async function NewProposalPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const proposalType = parseProposalType(type);

  if (!proposalType.ok) {
    notFound();
  }

  return <NewProposalRoute proposalType={proposalType.value} />;
}
