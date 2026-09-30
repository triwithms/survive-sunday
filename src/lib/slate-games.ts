import "server-only";
import { prisma } from "./db";
import { overlayGamesByNumber } from "./slate-overlay";

/** Null when this pool owns its Game rows (the live family pool). */
export async function slateSourcePoolId(poolId: string): Promise<string | null> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { slatePoolId: true },
  });
  return pool?.slatePoolId ?? null;
}

const poolGameInclude = {
  week: { include: { pool: { select: { season: true } } } },
} as const;

/** A game this pool can show: its own row, else one on the slate it borrows. */
export async function findPoolGame(poolId: string, gameId: string) {
  const own = await prisma.game.findFirst({
    where: { id: gameId, week: { poolId } },
    include: poolGameInclude,
  });
  if (own) return own;
  const source = await slateSourcePoolId(poolId);
  if (!source || source === poolId) return null;
  return prisma.game.findFirst({
    where: { id: gameId, week: { poolId: source } },
    include: poolGameInclude,
  });
}

/** Games keyed by week number from the shared slate. Null if this pool owns them. */
export async function slateGamesByNumber(poolId: string) {
  const source = await slateSourcePoolId(poolId);
  if (!source || source === poolId) return null;
  const weeks = await prisma.week.findMany({
    where: { poolId: source },
    select: { number: true, games: true },
  });
  return new Map(weeks.map((week) => [week.number, week.games]));
}

/**
 * Live-pool weeks already have games, so this returns them unchanged and
 * does not query. Empty shells (a new pool) are filled from the slate.
 */
export async function overlayPoolWeeks<
  T extends { number: number; games: unknown[] },
>(poolId: string, weeks: T[]): Promise<T[]> {
  if (weeks.length === 0 || weeks.every((week) => week.games.length > 0)) {
    return weeks;
  }
  const slate = await slateGamesByNumber(poolId);
  return overlayGamesByNumber(
    weeks,
    slate as Map<number, T["games"]> | null
  );
}

export async function withSlateGames<
  T extends { poolId: string; number: number; games: unknown[] },
>(week: T): Promise<T> {
  const [filled] = await overlayPoolWeeks(week.poolId, [week]);
  return filled ?? week;
}
