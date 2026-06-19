import type { Metadata } from "next";
import { ProposalsRoute } from "@/features/proposals/proposal-routes";

export const metadata: Metadata = {
  title: "Proposal workbench | OLManager Data Manager",
  description: "Create and review fixture-backed OLManager data proposals in the MVP session workbench.",
};

export default function ProposalsPage() {
  return <ProposalsRoute />;
}
