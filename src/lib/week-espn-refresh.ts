import "server-only";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { shouldPollLiveScores } from "@/lib/game-display";
import { isWeekScoreboardFresh } from "@/lib/espn-scoreboard";
import { syncWeekScoresFromEspn } from "@/lib/live-scores";
import { pageEspnRefreshShape } from "@/lib/static-cache-ttl";
import { enqueueWeekWork } from "@/lib/week-work-queue";

/**
 * Player tabs read Postgres and return. ESPN runs after the response via
 * `after` (Vercel waitUntil) so a cold isolate still finishes the write.
 * The scoreboard TTL applies during the live window too.
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
  const run = () => {
    const pending = inflight.get(weekId);
    if (pending) return pending;

    const job = enqueueWeekWork(
      weekId,
      () => syncWeekScoresFromEspn(weekId, shape).then(() => undefined)
    )
      .then(() => undefined)
      .catch((err) => {
        console.error("deferred page espn refresh failed", weekId, err);
      })
      .finally(() => {
        if (inflight.get(weekId) === job) inflight.delete(weekId);
      });
    inflight.set(weekId, job);
    return job;
  };

  try {
    after(run);
  } catch (err) {
    console.error("after() unavailable for page espn refresh", err);
    void run();
  }
}

/** Gates on the scoreboard TTL and never waits on ESPN. */
export async function syncWeekEspnForPage(
  weekId: string,
  loadedWeek?: WeekRefreshSnapshot
): Promise<void> {
  const week = loadedWeek ?? await prisma.week.findUnique({
    where: { id: weekId },
    select: {
      number: true,
      games: { select: { status: true, kickoff: true } },
    },
  });
  if (!week) return;
  if (isWeekScoreboardFresh(week.number)) return;

  const shape = pageEspnRefreshShape(shouldPollLiveScores(week.games));
  scheduleWeekEspnRefresh(weekId, shape);
}
