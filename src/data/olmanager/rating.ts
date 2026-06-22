import type { PlayerAttributes } from "./types";

// Parity anchor: this is the same 9-stat mean used by
// OLManager/src/lib/players/lolPlayerStats.ts::calculateLolOvr
// and by playerRating.ts::baseOvr.

export const PLAYER_RATING_MIN = 1;
export const PLAYER_RATING_MAX = 99;
export const PLAYER_RATING_RANGE_LABEL = `${PLAYER_RATING_MIN} to ${PLAYER_RATING_MAX}`;
export const PLAYER_RATING_HINT = `Integer from ${PLAYER_RATING_RANGE_LABEL}.`;
export const PLAYER_RATING_ERROR_MESSAGE = `Rating must be an integer from ${PLAYER_RATING_RANGE_LABEL}.`;

export function calculateLolOvr(attributes: PlayerAttributes): number {
  const values = [
    attributes.mechanics,
    attributes.laning,
    attributes.teamfighting,
    attributes.macro_play,
    attributes.consistency,
    attributes.shotcalling,
    attributes.champion_pool,
    attributes.discipline,
    attributes.mental_resilience,
  ];

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.max(PLAYER_RATING_MIN, Math.min(PLAYER_RATING_MAX, Math.round(average)));
}
