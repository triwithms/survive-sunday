import type { PrismaClient } from "@prisma/client";
import { isPlaceholderOdds } from "./odds";

/** Wipe the seed’s fake home -3 / away +3 / ML -150/+130 combo. */
export async function clearPlaceholderOdds(db: PrismaClient): Promise<number> {
  const games = await db.game.findMany({
    select: {
      id: true,
      spreadHome: true,
      spreadAway: true,
      mlHome: true,
      mlAway: true,
    },
  });
  const ids = games.filter((g) => isPlaceholderOdds(g)).map((g) => g.id);
  if (ids.length === 0) return 0;
  const result = await db.game.updateMany({
    where: { id: { in: ids } },
    data: {
      spreadHome: null,
      spreadAway: null,
      mlHome: null,
      mlAway: null,
    },
  });
  return result.count;
}
