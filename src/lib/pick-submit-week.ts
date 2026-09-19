import "server-only";
import { prisma } from "./db";
import { resolvedPoolWeek } from "./pool-current-week-db";
import { isWeekLocked } from "./grading";
import {
  isPlayerPickWeek,
  playerPickWeekError,
  resolvePlayerPickWeekFromLoaded,
} from "./next-week-picks";

export type SubmitMembership = {
  id: string;
  poolId: string;
  playingFromWeek: number | null;
  usedTeamsJson: string;
  nickname: string;
  pool: { mode: string | null; currentWeek: number };
  user: { id: string; email: string | null; phoneE164?: string | null };
};

export type SubmitPickFail = {
  ok: false;
  error: string;
  status: number;
  locked?: boolean;
};
export type SubmitPickOk = {
  ok: true;
  pick: { id: string; teamAbbr: string; weekId: string };
  locked: false;
};
export type SubmitPickResult = SubmitPickOk | SubmitPickFail;

export async function loadEligibleWeek(
  membership: SubmitMembership,
  weekNumber: number
) {
  const relatedWeeks = await prisma.week.findMany({
    where: { poolId: membership.poolId },
    include: { games: true },
  });
  const { currentWeek } = resolvedPoolWeek(
    membership.pool.mode,
    membership.pool.currentWeek,
    relatedWeeks
  );
  const currentWeekRow = relatedWeeks.find((row) => row.number === currentWeek);
  const nextWeekRow = relatedWeeks.find((row) => row.number === currentWeek + 1);
  const myCurrentWeekPick = currentWeekRow
    ? await prisma.pick.findUnique({
        where: {
          membershipId_weekId: {
            membershipId: membership.id,
            weekId: currentWeekRow.id,
          },
        },
      })
    : null;
  const myNextWeekPick = nextWeekRow
    ? await prisma.pick.findUnique({
        where: {
          membershipId_weekId: {
            membershipId: membership.id,
            weekId: nextWeekRow.id,
          },
        },
      })
    : null;
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: relatedWeeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick: myCurrentWeekPick,
    nextPick: myNextWeekPick,
    playingFromWeek: membership.playingFromWeek,
  });
  if (!isPlayerPickWeek(decision, weekNumber)) {
    return {
      ok: false as const,
      error: playerPickWeekError(decision, weekNumber),
      status: 403,
    };
  }
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: membership.poolId, number: weekNumber },
    },
    include: { games: true },
  });
  if (!week) {
    return { ok: false as const, error: "Week not found", status: 404 };
  }
  return { ok: true as const, week };
}
