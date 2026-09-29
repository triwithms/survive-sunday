import { prisma } from "./db";
import { syncPoolWeekFromEspn } from "./live-scores";
import { slateGamesByNumber } from "./slate-games";
import { parseSkippedWeeks } from "./week-wrap-parse";
import { ensureWeekWrapTable } from "./week-wrap-schema";
import { sendWeekWrap, type WeekWrapSendCounts } from "./week-wrap-send";
import { shouldAutoSend } from "./week-wrap-status";
import { allGamesFinal, isNoonDayAfterKickoff } from "./week-wrap-when";

export async function runDueWeekWraps(now = new Date()) {
  await ensureWeekWrapTable(prisma);
  const pools = await prisma.pool.findMany({
    select: {
      id: true,
      weekWrapSetting: { select: { skippedWeeksJson: true } },
      slatePoolId: true,
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
    const needsSlate = pool.weeks.some((week) => week.games.length === 0);
    const slate = needsSlate ? await slateGamesByNumber(pool.id) : null;
    for (const week of pool.weeks) {
      if (skippedWeeks.includes(week.number)) continue;
      const shared = week.games.length > 0 ? week.games : (slate?.get(week.number) ?? []);
      if (!isNoonDayAfterKickoff(shared, now)) continue;
      let games = shared;
      const alreadyFinal = allGamesFinal(games);
      if (!alreadyFinal) {
        try {
          await syncPoolWeekFromEspn(week.id);
          games =
            week.games.length > 0
              ? await prisma.game.findMany({
                  where: { weekId: week.id },
                  select: { status: true, kickoff: true },
                })
              : ((await slateGamesByNumber(pool.id))?.get(week.number) ?? []);
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
