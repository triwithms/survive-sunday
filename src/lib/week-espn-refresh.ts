import "server-only";
import { prisma } from "@/lib/db";
import { deferAfter } from "@/lib/defer-after";
import { shouldPollLiveScores } from "@/lib/game-display";
import { isWeekScoreboardFresh } from "@/lib/espn-scoreboard";
import { syncPoolWeekFromEspn, syncWeekScoresFromEspn } from "@/lib/live-scores";
import { pageEspnRefreshShape } from "@/lib/static-cache-ttl";
import { enqueueWeekWork } from "@/lib/week-work-queue";

/**
 * Player tabs read Postgres and return. ESPN runs after the response via
 * `after` (Vercel waitUntil) so a cold isolate still finishes the write.
 * The scoreboard TTL applies during the live window too.
 * A failure is logged and never fails the page.
 */
const inflight = new Map<string, Promise<void>>();
type WeekRefreshSnapshot = {
  number: number;
  games: Array<{ status: string; kickoff: Date | string }>;
};

function scheduleWeekEspnRefresh(
  weekId: string,
  shape: { standings: false; grade: boolean }
) {
  deferAfter("page espn refresh", () => {
    const pending = inflight.get(weekId);
    if (pending) return pending;

    let settled: Promise<void> = Promise.resolve();
    const job = enqueueWeekWork(weekId, () =>
      syncWeekScoresFromEspn(weekId, shape).then(() => undefined)
    ).finally(() => {
      if (inflight.get(weekId) === settled) inflight.delete(weekId);
    });
    settled = job.then(
      () => undefined,
      () => undefined
    );
    inflight.set(weekId, settled);
    return job;
  });
}

/** Gates on the scoreboard TTL and never waits on ESPN. Never throws. */
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
          games: { select: { status: true, kickoff: true } },
        },
      }));
    if (!week) return;
    if (week.games.length === 0) {
      deferAfter("slate pool scores", () =>
        syncPoolWeekFromEspn(weekId, { standings: false, grade: true }).then(
          () => undefined
        )
      );
      return;
    }
    if (isWeekScoreboardFresh(week.number)) return;

    const shape = pageEspnRefreshShape(shouldPollLiveScores(week.games));
    scheduleWeekEspnRefresh(weekId, shape);
  } catch (error) {
    console.error("page espn refresh schedule skipped", error);
  }
}
