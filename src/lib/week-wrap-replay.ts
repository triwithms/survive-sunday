import { weekCountsForPool } from "./pool-start-week";
import { decideStatusAfterLoss } from "./pool-rules";
import {
  countedWrapWin,
  wrapShownResult,
  type WrapHistoryPick,
  type WrapRules,
  type WrapSeat,
} from "./week-wrap-history";
import { isWrapLoss } from "./week-wrap-players";

const MISS = "MISS";

export type SeatReplay = {
  status: string;
  losses: number;
  weeksSurvived: number;
  eliminatedWeek: number | null;
  shown: WrapHistoryPick[];
};

function miss(seatId: string, weekNumber: number): WrapHistoryPick {
  return {
    membershipId: seatId,
    weekNumber,
    teamAbbr: MISS,
    result: "loss",
    source: "missed",
  };
}

/** Status through this week from picks. Today's membership row is not an input. */
export function replaySeat(
  seat: WrapSeat,
  picks: WrapHistoryPick[],
  weekNumber: number,
  rules: WrapRules
): SeatReplay {
  const byWeek = new Map(
    picks
      .filter((pick) => pick.membershipId === seat.id && pick.weekNumber <= weekNumber)
      .map((pick) => [pick.weekNumber, pick])
  );
  const locked = new Set((rules.lockedWeeks ?? []).filter((n) => n <= weekNumber));
  const numbers = [...new Set([...byWeek.keys(), ...locked])].sort((a, b) => a - b);
  let status = "undefeated";
  let losses = 0;
  let weeksSurvived = 0;
  let mulliganRemaining = true;
  let eliminatedWeek: number | null = null;
  const shown: WrapHistoryPick[] = [];

  for (const n of numbers) {
    const playing = seat.playingFromWeek == null || n >= seat.playingFromWeek;
    const counts = weekCountsForPool(rules.startWeek, n);
    let pick = byWeek.get(n);
    if (!pick && locked.has(n) && playing && counts && status !== "eliminated") {
      pick = miss(seat.id, n);
    }
    if (!pick) continue;
    const result = wrapShownResult(pick);
    shown.push({ ...pick, result });
    if (countedWrapWin(pick, result)) weeksSurvived += 1;
    if (status === "eliminated" || !counts || !playing) continue;
    if (!isWrapLoss(pick.teamAbbr, result)) continue;
    const decision = decideStatusAfterLoss({
      currentStatus: status,
      mulliganRemaining,
      weekNumber: n,
      singleEliminationFromWeek: rules.singleEliminationFromWeek,
    });
    if (decision.unchanged) continue;
    losses += 1;
    status = decision.status;
    mulliganRemaining = decision.mulliganRemaining;
    if (status === "eliminated") eliminatedWeek = n;
  }

  return { status, losses, weeksSurvived, eliminatedWeek, shown };
}
