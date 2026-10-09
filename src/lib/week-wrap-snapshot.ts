import { pickWinMargin } from "../components/features/board/win-margin";
import { prisma } from "./db";
import { isWeekLocked } from "./grading";
import { wrapWeekFromHistory } from "./week-wrap-as-of";
import type { WrapHistoryPick, WrapRules, WrapSeat } from "./week-wrap-history";
import type { WeekWrapBoardRow } from "./week-wrap-rich-types";
import type { WeekWrapPlayer } from "./week-wrap-types";

export type WrapSeason = {
  members: WrapSeat[];
  picks: WrapHistoryPick[];
  rules: WrapRules;
  /** Raw pool column. Callers resolve it with showTeamLogosFor. */
  showTeamLogos: boolean | null;
  startWeek: number | null;
};

const gameSelect = {
  awayAbbr: true,
  homeAbbr: true,
  scoreAway: true,
  scoreHome: true,
  status: true,
} as const;

/** Picks and lock state for every week. Read-only. Each wrap week is sliced later. */
export async function loadWrapSeason(poolId: string): Promise<WrapSeason | null> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: {
      startWeek: true,
      singleEliminationFromWeek: true,
      showTeamLogos: true,
      memberships: {
        select: {
          id: true,
          nickname: true,
          role: true,
          isParticipant: true,
          playingFromWeek: true,
          autoPickStamps: true,
        },
      },
      weeks: {
        select: { number: true, status: true, lockAt: true, lockOverrideAt: true },
      },
    },
  });
  if (!pool) return null;
  const rows = await prisma.pick.findMany({
    where: { membership: { poolId } },
    select: {
      membershipId: true,
      teamAbbr: true,
      result: true,
      source: true,
      week: { select: { number: true } },
      game: { select: gameSelect },
    },
  });
  const lockedWeeks = pool.weeks
    .filter(
      (week) =>
        week.status === "locked" || week.status === "graded" || isWeekLocked(week)
    )
    .map((week) => week.number);
  return {
    members: pool.memberships,
    picks: rows.map((row) => ({
      membershipId: row.membershipId,
      weekNumber: row.week.number,
      teamAbbr: row.teamAbbr,
      result: row.result,
      source: row.source,
      margin: pickWinMargin(row),
      game: row.game,
    })),
    rules: {
      startWeek: pool.startWeek,
      singleEliminationFromWeek: pool.singleEliminationFromWeek,
      lockedWeeks,
    },
    showTeamLogos: pool.showTeamLogos,
    startWeek: pool.startWeek,
  };
}

export function wrapWeekView(
  season: WrapSeason,
  weekNumber: number
): { players: WeekWrapPlayer[]; board: WeekWrapBoardRow[] } {
  return wrapWeekFromHistory(
    season.members,
    season.picks,
    weekNumber,
    season.rules
  );
}
