import "server-only";
import { prisma } from "@/lib/db";
import { deferAfter } from "@/lib/defer-after";
import { shouldPollLiveScores } from "@/lib/game-display";
import { syncPoolWeekFromEspn } from "@/lib/live-scores";
import { slateRefresher } from "@/lib/slate-refresh";
import { pageEspnRefreshShape } from "@/lib/static-cache-ttl";

/**
 * Player tabs read Postgres and return. ESPN runs after the response via
 * `after` (Vercel waitUntil) so a cold isolate still finishes the write.
 * The write is keyed by the slate owner's Week, so a pool that borrows the
 * slate reuses the owner's rows instead of syncing its own empty week.
 * A failure is logged and never fails the page.
 */
type WeekRefreshSnapshot = {
  number: number;
  /** Overlaid games carry the slate owner's weekId. */
  games: Array<{ status: string; kickoff: Date | string; weekId?: string }>;
};

/** Gates on the shared slate write and never waits on ESPN. Never throws. */
export async function syncWeekEspnForPage(
  weekId: string,
  loadedWeek?: WeekRefreshSnapshot
): Promise<void> {
  try {
    const week =
      loadedWeek ??
      (await prisma.week.findUnique({
        where: { id: weekId },
        select: {
          number: true,
          games: { select: { status: true, kickoff: true, weekId: true } },
        },
      }));
    if (!week) return;
    const slateWeekId = week.games[0]?.weekId;
    if (slateWeekId && slateRefresher.isSettled({ slateWeekId, number: week.number, year: 2026 })) {
      return;
    }

    const shape = pageEspnRefreshShape(shouldPollLiveScores(week.games));
    deferAfter("page espn refresh", () => syncPoolWeekFromEspn(weekId, shape));
  } catch (error) {
    console.error("page espn refresh schedule skipped", error);
  }
}
