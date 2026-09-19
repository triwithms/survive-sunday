import { autoPickStampCount } from "@/lib/auto-pick-stamps";
import { isAlive } from "@/lib/tiebreak";

/** Leaderboard season race — not the weekly Selections / Scores pick list. */
export type BoardRaceMember = {
  status: string;
  nickname: string;
  weeksSurvived: number;
  losses: number;
  autoPickStamps?: number | null;
  /** Cumulative margin of winning graded picks. Tiebreak among equals only. */
  winMargin?: number;
};

/**
 * 1. Alive / in, then eliminated / out
 * 2. Fewest losses, then most weeks survived (mulligan / one-and-done)
 * 3. Among equals: clean record (no 💩) → live win margin → nickname A–Z
 * Win margin never outranks a still-alive player.
 */
export function sortBoard<T extends BoardRaceMember>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const inA = isAlive(a.status) ? 0 : 1;
    const inB = isAlive(b.status) ? 0 : 1;
    if (inA !== inB) return inA - inB;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (a.weeksSurvived !== b.weeksSurvived) {
      return b.weeksSurvived - a.weeksSurvived;
    }
    const stamps =
      autoPickStampCount(a.autoPickStamps) -
      autoPickStampCount(b.autoPickStamps);
    if (stamps) return stamps;
    const mov = (b.winMargin ?? 0) - (a.winMargin ?? 0);
    if (mov) return mov;
    return a.nickname.localeCompare(b.nickname, "en-CA");
  });
}
