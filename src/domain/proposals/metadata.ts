import type { ProposalType } from "./types";

export const PROPOSAL_TYPE_METADATA = {
  AddPlayer: {
    label: "Add player",
    description: "Create a new LoL player record for review.",
    href: "/proposals/new/AddPlayer",
  },
  EditPlayer: {
    label: "Edit player",
    description: "Propose changes to an existing player's profile or attributes.",
    href: "/proposals/new/EditPlayer",
  },
  TransferPlayer: {
    label: "Transfer player",
    description: "Move an existing player between LoL teams with validation.",
    href: "/proposals/new/TransferPlayer",
  },
  AddStaff: {
    label: "Add staff",
    description: "Create a new staff member record for review.",
    href: "/proposals/new/AddStaff",
  },
  EditStaff: {
    label: "Edit staff",
    description: "Propose changes to an existing staff member.",
    href: "/proposals/new/EditStaff",
  },
  ReleaseStaff: {
    label: "Release staff",
    description: "Record a staff release with reason and severance.",
    href: "/proposals/new/ReleaseStaff",
  },
  EditTeam: {
    label: "Edit team",
    description: "Propose changes to a team's budget, focus, or identity.",
    href: "/proposals/new/EditTeam",
  },
} as const satisfies Record<
  ProposalType,
  { label: string; description: string; href: `/proposals/new/${ProposalType}` }
>;

export const SUPPORTED_PROPOSAL_TYPES = Object.keys(
  PROPOSAL_TYPE_METADATA,
) as ProposalType[];

export const SUPPORTED_PROPOSAL_TYPE_NAMES = SUPPORTED_PROPOSAL_TYPES.join(", ");
