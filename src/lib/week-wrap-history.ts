/** One pick on the pool's own week, plus the game it grades against. */

export type WrapGame = {
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  status: string;
};

export type WrapHistoryPick = {
  membershipId: string;
  weekNumber: number;
  teamAbbr: string;
  result: string | null;
  source?: string | null;
  margin?: number | null;
  game?: WrapGame | null;
};

export type WrapRules = {
  startWeek?: number | null;
  singleEliminationFromWeek?: number | null;
  /** Locked or graded weeks: a playing seat with no pick is a miss. */
  lockedWeeks?: number[];
};

export type WrapSeat = {
  id: string;
  nickname: string;
  role?: string;
  isParticipant?: boolean;
  playingFromWeek?: number | null;
  autoPickStamps?: number | null;
};

const MISS = "MISS";

/**
 * Stored grade wins. A still-pending row uses the final score (tie = loss),
 * same rules as gradePickFromScore, so a wrap can be right before the write.
 */
export function wrapShownResult(pick: WrapHistoryPick): string | null {
  const stored = pick.result;
  const value = (stored ?? "").toLowerCase();
  if (value && value !== "pending") return stored;
  const game = pick.game;
  if (!game || (pick.teamAbbr ?? "").toUpperCase() === MISS) return stored;
  if (game.status !== "final" || game.scoreAway == null || game.scoreHome == null) {
    return stored;
  }
  if (game.scoreAway === game.scoreHome) return "loss";
  const winner = game.scoreAway > game.scoreHome ? game.awayAbbr : game.homeAbbr;
  return pick.teamAbbr === winner ? "win" : "loss";
}

export function countedWrapWin(pick: WrapHistoryPick, result: string | null): boolean {
  return (
    (result ?? "").toLowerCase() === "win" &&
    pick.source !== "missed" &&
    (pick.teamAbbr ?? "").toUpperCase() !== MISS
  );
}
