import { prisma } from "./db";
import { syncWeekScoresFromEspn } from "./live-scores";
import { parseSkippedWeeks } from "./week-wrap-types";
import { sendWeekWrap, type WeekWrapSendCounts } from "./week-wrap-send";
import { ensureWeekWrapTable } from "./week-wrap-schema";
import {
  allGamesFinal,
  latestKickoff,
  shouldAutoSend,
  torontoDaySpan,
} from "./week-wrap-when";

function inMorningWindow(
  games: { status?: string | null; kickoff?: Date | null }[],
  now: Date
) {
  const last = latestKickoff(games);
  if (!last) return false;
  const span = torontoDaySpan(last, now);
  return span >= 1 && span <= 7;
}

export async function runDueWeekWraps(now = new Date()) {
  await ensureWeekWrapTable(prisma);
  const pools = await prisma.pool.findMany({
    select: {
      id: true,
      weekWrapSetting: { select: { skippedWeeksJson: true } },
      weeks: {
        select: {
          id: true,
          number: true,
          games: { select: { status: true, kickoff: true } },
        },
      },
    },
  });
  const ran: Array<{ poolId: string; weekNumber: number } & WeekWrapSendCounts> =
    [];
  for (const pool of pools) {
    const skippedWeeks = parseSkippedWeeks(pool.weekWrapSetting?.skippedWeeksJson);
    for (const week of pool.weeks) {
      if (skippedWeeks.includes(week.number)) continue;
      if (!inMorningWindow(week.games, now)) continue;
      let games = week.games;
      const alreadyFinal = allGamesFinal(games);
      if (!alreadyFinal) {
        try {
          await syncWeekScoresFromEspn(week.id);
          games = await prisma.game.findMany({
            where: { weekId: week.id },
            select: { status: true, kickoff: true },
          });
        } catch (error) {
          console.warn("[week-wrap] score sync failed", week.id, error);
          continue;
        }
      }
      if (
        !shouldAutoSend({
          games,
          now,
          skippedWeeks: [],
          weekNumber: week.number,
        })
      ) {
        continue;
      }
      try {
        const result = await sendWeekWrap(pool.id, week.number, null, {
          refresh: alreadyFinal,
        });
        if (result.ok) {
          ran.push({
            poolId: pool.id,
            weekNumber: week.number,
            ...result.counts,
          });
        }
      } catch (error) {
        console.error("[week-wrap] pool failed", pool.id, week.number, error);
      }
    }
  }
  return { checked: pools.length, ran };
}
