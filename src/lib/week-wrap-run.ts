import { prisma } from "./db";
import { syncWeekScoresFromEspn } from "./live-scores";
import { parseSkippedWeeks } from "./week-wrap-types";
import { sendWeekWrap, type WeekWrapSendCounts } from "./week-wrap-send";
import { ensureWeekWrapTable } from "./week-wrap-schema";
import {
  allGamesFinal,
  isNoonDayAfterKickoff,
  shouldAutoSend,
} from "./week-wrap-when";

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
      if (!isNoonDayAfterKickoff(week.games, now)) continue;
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
