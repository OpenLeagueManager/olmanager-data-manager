"use client";

import { createValidator } from "@/domain/proposals/validation";
import { buildProposalDiff } from "@/domain/proposals/diff";
import type { ProposalPayload, DiffRecord } from "@/domain/proposals/types";
import { GameDataProvider, type GameDataSet, type SocialDataSet } from "./game-data-context";
import type { ReactNode } from "react";

type Props = {
  game: GameDataSet;
  social: SocialDataSet;
  children: ReactNode;
};

export function GameDataClientLoader({ game, social, children }: Props) {
  const { validateProposal } = createValidator(game, social);

  const buildDiff = (proposal: ProposalPayload): DiffRecord[] =>
    buildProposalDiff(proposal, game, social);

  return (
    <GameDataProvider
      game={game}
      social={social}
      validateProposal={validateProposal}
      buildProposalDiff={buildDiff}
    >
      {children}
    </GameDataProvider>
  );
}
