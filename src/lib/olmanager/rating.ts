import type { PlayerAttributes } from "./types";

export const PLAYER_RATING_MIN = 1;
export const PLAYER_RATING_MAX = 99;
export const PLAYER_RATING_ERROR_MESSAGE = "Rating must be an integer from 1 to 99.";
export const PLAYER_RATING_HINT = `Integer ${PLAYER_RATING_MIN}-${PLAYER_RATING_MAX}.`;

export function calculateLolOvr(attributes: Partial<PlayerAttributes> | Record<string, number>): number {
  const entries = Object.entries(attributes).filter(([, value]) => typeof value === "number");
  if (entries.length === 0) return 0;
  return Math.round(entries.reduce((sum, [, value]) => sum + value, 0) / entries.length);
}
