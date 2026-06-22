import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseProposalType } from "@/domain/proposals/validation";
import { NewProposalRoute } from "@/features/proposals/proposal-routes";

export const metadata: Metadata = {
  title: "New proposal | OLManager Data Manager",
  description: "Create a typed, canonical-data-backed OLManager data proposal.",
};

type Props = {
  params: Promise<{ type: string }>;
  searchParams?: Promise<{ entityId?: string }>;
};

export default async function NewProposalPage({ params, searchParams }: Props) {
  const { type } = await params;
  const { entityId } = await (searchParams ?? Promise.resolve({ entityId: undefined }));
  const proposalType = parseProposalType(type);

  if (!proposalType.ok) {
    notFound();
  }

  return <NewProposalRoute proposalType={proposalType.value} initialEntityId={entityId} />;
}
