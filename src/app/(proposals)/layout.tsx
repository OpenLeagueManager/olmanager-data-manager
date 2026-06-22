import { Shell } from "@/components/layout/Shell";
import { GameDataLoader } from "@/lib/data/game-data-loader";
import type { ReactNode } from "react";

export default function ProposalsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Shell>
      <GameDataLoader>{children}</GameDataLoader>
    </Shell>
  );
}
