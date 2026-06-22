"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompetitionManifest, Player, SocialAccountData, SocialTemplateData, Staff, Team } from "@/data/olmanager/types";
import type { DiffRecord, ProposalPayload, ProposalType, ValidationResult } from "@/domain/proposals/types";

export type GameDataSet = {
  manifests: CompetitionManifest[];
  teams: Team[];
  players: Player[];
  staff: Staff[];
};

export type SocialDataSet = {
  accounts: SocialAccountData[];
  templates: SocialTemplateData[];
};

export type GameDataContextValue = {
  game: GameDataSet;
  social: SocialDataSet;
  validateProposal: (input: unknown) => ValidationResult<ProposalPayload>;
  buildProposalDiff: (proposal: ProposalPayload) => DiffRecord[];
};

const GameDataContext = createContext<GameDataContextValue | null>(null);

export function GameDataProvider({
  game,
  social,
  validateProposal,
  buildProposalDiff,
  children,
}: {
  game: GameDataSet;
  social: SocialDataSet;
  validateProposal: (input: unknown) => ValidationResult<ProposalPayload>;
  buildProposalDiff: (proposal: ProposalPayload) => DiffRecord[];
  children: ReactNode;
}) {
  return (
    <GameDataContext.Provider value={{ game, social, validateProposal, buildProposalDiff }}>
      {children}
    </GameDataContext.Provider>
  );
}

export function useGameData(): GameDataContextValue {
  const ctx = useContext(GameDataContext);
  if (!ctx) {
    throw new Error("useGameData must be used within a <GameDataProvider>");
  }
  return ctx;
}
