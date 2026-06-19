import type { ProposalType } from "./types";

export const PROPOSAL_TYPE_METADATA = {
  AddPlayer: {
    label: "Add player",
    description: "Create a new fixture-backed player record for review.",
    href: "/proposals/new/AddPlayer",
  },
  EditPlayerAttributes: {
    label: "Edit player attributes",
    description: "Propose a name, position, or rating change for an existing player.",
    href: "/proposals/new/EditPlayerAttributes",
  },
  TransferPlayer: {
    label: "Transfer player",
    description: "Move an existing player between fixture teams with validation.",
    href: "/proposals/new/TransferPlayer",
  },
} as const satisfies Record<
  ProposalType,
  { label: string; description: string; href: `/proposals/new/${ProposalType}` }
>;

export const SUPPORTED_PROPOSAL_TYPES = Object.keys(
  PROPOSAL_TYPE_METADATA,
) as ProposalType[];

export const SUPPORTED_PROPOSAL_TYPE_NAMES = SUPPORTED_PROPOSAL_TYPES.join(", ");
