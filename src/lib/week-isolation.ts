import type { PrismaClient } from "@prisma/client";
import { POOL_MODE_LIVE, REAL_CURRENT_WEEK } from "./pool-mode";

export type WeekIsolationResult = {
  changed: boolean;
  clearedPicks: number;
  currentWeek: number;
};

/**
 * Force the pool to live mode and Week 1.
 * Does not wipe picks, reseed, or run ensure-production-db.
 */
export async function ensureLiveWeekIsolation(
  db: PrismaClient,
  pool: { id: string; mode: string; currentWeek: number }
): Promise<WeekIsolationResult> {
  const needsLive = pool.mode !== POOL_MODE_LIVE;
  const needsSnap = pool.currentWeek !== REAL_CURRENT_WEEK;
  if (!needsLive && !needsSnap) {
    return {
      changed: false,
      clearedPicks: 0,
      currentWeek: REAL_CURRENT_WEEK,
    };
  }

  await db.pool.update({
    where: { id: pool.id },
    data: { mode: POOL_MODE_LIVE, currentWeek: REAL_CURRENT_WEEK },
  });
  return {
    changed: true,
    clearedPicks: 0,
    currentWeek: REAL_CURRENT_WEEK,
  };
}
