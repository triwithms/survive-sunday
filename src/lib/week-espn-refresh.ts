import "server-only";
import { prisma } from "@/lib/db";
import { shouldPollLiveScores } from "@/lib/game-display";
import { isWeekScoreboardFresh } from "@/lib/espn-scoreboard";
import { syncWeekScoresFromEspn } from "@/lib/live-scores";

/**
 * Scores / Schedule: reuse last-good slate inside TTL. Live window still syncs.
 * Picks / cron / /api/scores/sync keep calling syncWeekScoresFromEspn directly.
 */
export async function syncWeekEspnForPage(weekId: string): Promise<void> {
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: { games: true },
  });
  if (!week) return;
  if (!shouldPollLiveScores(week.games) && isWeekScoreboardFresh(week.number)) {
    return;
  }
  await syncWeekScoresFromEspn(weekId);
}
