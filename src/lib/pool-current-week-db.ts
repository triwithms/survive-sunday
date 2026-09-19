import "server-only";
import type { PrismaClient } from "@prisma/client";
import { effectiveCurrentWeek } from "./pool-mode";
import {
  derivePoolCurrentWeek,
  shouldAdvanceStoredWeek,
  type PoolSlateWeek,
} from "./pool-current-week";

export function resolvedPoolWeek(
  mode: string | null | undefined,
  storedWeek: number | null | undefined,
  weeks: PoolSlateWeek[]
): { stored: number; currentWeek: number } {
  const stored = effectiveCurrentWeek(mode, storedWeek);
  return { stored, currentWeek: derivePoolCurrentWeek(stored, weeks) };
}

/** Forward-only. Never lowers currentWeek or touches picks. */
export async function persistPoolWeekAdvance(
  db: PrismaClient,
  poolId: string,
  stored: number,
  currentWeek: number
): Promise<boolean> {
  if (!shouldAdvanceStoredWeek(stored, currentWeek)) return false;
  try {
    await db.pool.update({
      where: { id: poolId },
      data: { currentWeek },
    });
    return true;
  } catch (error) {
    console.error("pool week advance skipped", error);
    return false;
  }
}
