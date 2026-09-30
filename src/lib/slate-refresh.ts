import "server-only";
import { prisma } from "@/lib/db";
import { freshScoreboardFetchedAt } from "@/lib/espn-scoreboard";
import {
  createSlateRefresher,
  ownSlateWeekId,
  type SlateWeekKey,
} from "@/lib/slate-refresh-gate";

export type SlateWeekTarget = SlateWeekKey & {
  viewerWeekId: string;
  viewerPoolId: string;
  /** True when the Game rows live on another pool's week. */
  borrowed: boolean;
};

/**
 * Per warm server instance, like the scoreboard cache it keys off. Cross-instance
 * duplicates are bounded by that same ESPN TTL.
 */
export const slateRefresher = createSlateRefresher(freshScoreboardFetchedAt);

export async function resolveSlateWeek(
  viewerWeekId: string
): Promise<SlateWeekTarget | null> {
  const week = await prisma.week.findUnique({
    where: { id: viewerWeekId },
    select: {
      id: true,
      number: true,
      poolId: true,
      pool: { select: { slatePoolId: true, season: true } },
      _count: { select: { games: true } },
    },
  });
  if (!week) return null;
  const base = {
    viewerWeekId: week.id,
    viewerPoolId: week.poolId,
    number: week.number,
    year: Number(String(week.pool.season).slice(0, 4)) || 2026,
  };
  const own = ownSlateWeekId({
    id: week.id,
    poolId: week.poolId,
    ownGameCount: week._count.games,
    slatePoolId: week.pool.slatePoolId,
  });
  if (own) return { ...base, slateWeekId: own, borrowed: false };
  const slate = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: week.pool.slatePoolId!, number: week.number },
    },
    select: { id: true },
  });
  return slate
    ? { ...base, slateWeekId: slate.id, borrowed: true }
    : { ...base, slateWeekId: week.id, borrowed: false };
}
