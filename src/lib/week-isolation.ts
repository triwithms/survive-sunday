import type { PrismaClient } from "@prisma/client";
import { POOL_MODE_LIVE } from "./pool-mode";

export type WeekIsolationResult = {
  changed: boolean;
  clearedPicks: number;
  currentWeek: number;
};

export type LiveIsolationPatch = {
  changed: boolean;
  currentWeek: number;
  data: { mode: typeof POOL_MODE_LIVE } | null;
};

/** Live-only: flip mode=live. Never snap currentWeek or wipe picks. */
export function liveIsolationPatch(pool: {
  mode: string;
  currentWeek: number;
}): LiveIsolationPatch {
  if (pool.mode === POOL_MODE_LIVE) {
    return { changed: false, currentWeek: pool.currentWeek, data: null };
  }
  return {
    changed: true,
    currentWeek: pool.currentWeek,
    data: { mode: POOL_MODE_LIVE },
  };
}

export async function ensureLiveWeekIsolation(
  db: PrismaClient,
  pool: { id: string; mode: string; currentWeek: number }
): Promise<WeekIsolationResult> {
  const patch = liveIsolationPatch(pool);
  if (!patch.data) {
    return { changed: false, clearedPicks: 0, currentWeek: pool.currentWeek };
  }
  await db.pool.update({ where: { id: pool.id }, data: patch.data });
  return { changed: true, clearedPicks: 0, currentWeek: pool.currentWeek };
}
