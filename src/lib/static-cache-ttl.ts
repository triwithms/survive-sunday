/** Slow-changing ESPN copies. Owner accepts stored last-good (same spirit as local helmets). */

/** Live scores stay hot while any game is in progress. */
export const SCOREBOARD_LIVE_TTL_MS = 20_000;
/** Week slate / kickoffs: skip ESPN on Scores/Schedule nav inside this window. */
export const SCOREBOARD_SLATE_TTL_MS = 6 * 60 * 60 * 1000;
export const SCOREBOARD_FAIL_TTL_MS = 45_000;
/** NFL Standings tab: background ESPN refresh at most this often per instance. */
export const STANDINGS_TTL_MS = 10 * 60 * 1000;

/** Injury report: serve last-good; refresh on TTL or content hash change. */
export const INJURY_TTL_MS = 24 * 60 * 60 * 1000;
export const INJURY_FAIL_TTL_MS = 45_000;
export const INJURY_SWR_MS = INJURY_TTL_MS * 2;

/**
 * Page refreshes leave standings to the heavy sync path and only grade when
 * games are outside the live window.
 */
export function pageEspnRefreshShape(live: boolean): {
  standings: false;
  grade: boolean;
} {
  return { standings: false, grade: !live };
}
