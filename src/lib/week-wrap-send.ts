import { prisma } from "./db";
import { ensureWeekLockedEffects, gradeWeekPicks } from "./grading";
import { syncWeekScoresFromEspn } from "./live-scores";
import { weekWrapContent } from "./week-wrap-copy";
import { loadWrapMembers, notifyWrapMembers, weekWrapSendMessage } from "./week-wrap-deliver";
import { loadWrapBoard, loadWrapNfl } from "./week-wrap-extras";
import { weekWrapPlayers } from "./week-wrap-players";
import { WEEK_WRAP_BOARD_URL } from "./week-wrap-sections";
import { loadWeekWrapSettings } from "./week-wrap-settings";
import { findWeekTouchdownVideo } from "./week-wrap-youtube";

export { weekWrapSendMessage } from "./week-wrap-deliver";
export type { WeekWrapSendCounts } from "./week-wrap-deliver";

export async function sendWeekWrap(
  poolId: string,
  weekNumber: number,
  actorId?: string | null,
  opts?: { refresh?: boolean }
): Promise<{ ok: true; counts: Awaited<ReturnType<typeof notifyWrapMembers>> } | { ok: false; error: string }> {
  const week = await prisma.week.findUnique({
    where: { poolId_number: { poolId, number: weekNumber } },
    select: { id: true, pool: { select: { season: true } } },
  });
  if (!week) return { ok: false, error: `No Week ${weekNumber} on this pool` };
  const seasonYear = Number(String(week.pool.season).slice(0, 4));
  if (opts?.refresh !== false) {
    try {
      await syncWeekScoresFromEspn(week.id);
    } catch (error) {
      console.warn("[week-wrap] score sync skipped", error);
    }
  }
  try {
    await ensureWeekLockedEffects(week.id);
    await gradeWeekPicks(week.id);
  } catch (error) {
    console.warn("[week-wrap] grade skipped", error);
  }
  const [settings, members, picks, touchdown, board, nfl] = await Promise.all([
    loadWeekWrapSettings(poolId),
    loadWrapMembers(poolId),
    prisma.pick.findMany({
      where: { weekId: week.id },
      select: { membershipId: true, teamAbbr: true, result: true },
    }),
    findWeekTouchdownVideo(weekNumber, {
      seasonYear: Number.isFinite(seasonYear) ? seasonYear : undefined,
    }).catch(() => null),
    loadWrapBoard(poolId),
    loadWrapNfl({ sync: true }),
  ]);
  const players = weekWrapPlayers(members, picks);
  const content = weekWrapContent({
    tone: settings.tone,
    blocks: settings.blocks,
    facts: { weekNumber, players, boardUrl: WEEK_WRAP_BOARD_URL, board, nfl },
    emailOverride: settings.emailOverride,
    smsOverride: settings.smsOverride,
    touchdown,
  });
  const counts = await notifyWrapMembers(members, content, poolId, weekNumber);
  await prisma.auditLog.create({
    data: {
      poolId,
      actorId: actorId ?? null,
      action: "week_wrap_sent",
      targetType: "week",
      targetId: String(weekNumber),
      details: JSON.stringify({
        summary: `Week ${weekNumber} · ${weekWrapSendMessage(counts)}`,
        tone: settings.tone,
        touchdown: Boolean(touchdown),
        nfl: Boolean(nfl),
      }),
    },
  });
  return { ok: true, counts };
}
