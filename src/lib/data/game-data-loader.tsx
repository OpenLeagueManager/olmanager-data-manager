import { getEmbeddedCompetition, getEmbeddedSocialCatalog } from "@/data/olmanager/embedded";
import { GameDataClientLoader } from "./game-data-client-loader";
import type { ReactNode } from "react";

export function GameDataLoader({ children }: { children: ReactNode }) {
  const comp = getEmbeddedCompetition();
  const social = getEmbeddedSocialCatalog();

  return (
    <GameDataClientLoader
      game={{
        manifests: comp.manifests,
        teams: comp.teams,
        players: comp.players,
        staff: comp.staff,
      }}
      social={{
        accounts: social.accounts,
        templates: social.templates,
      }}
    >
      {children}
    </GameDataClientLoader>
  );
}
