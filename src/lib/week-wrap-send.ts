import { prisma } from "./db";
import { ensureWeekLockedEffects, gradeWeekPicks } from "./grading";
import { syncWeekScoresFromEspn } from "./live-scores";
import { WEEK_WRAP_BOARD_URL, weekWrapContent } from "./week-wrap-copy";
import { weekWrapPlayers } from "./week-wrap-players";
import { loadWeekWrapSettings } from "./week-wrap-settings";
import { weekWrapDedupeKey } from "./week-wrap-types";
import { findWeekTouchdownVideo } from "./week-wrap-youtube";
import { notifyUser } from "./notify";

export type WeekWrapSendCounts = {
  sent: number;
  skipped: number;
  already: number;
};

export function weekWrapSendMessage(counts: WeekWrapSendCounts): string {
  return `Sent ${counts.sent} · already sent ${counts.already} · not delivered ${counts.skipped}`;
}

export async function sendWeekWrap(
  poolId: string,
  weekNumber: number,
  actorId?: string | null,
  opts?: { refresh?: boolean }
): Promise<{ ok: true; counts: WeekWrapSendCounts } | { ok: false; error: string }> {
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

  const [settings, members, picks, touchdown] = await Promise.all([
    loadWeekWrapSettings(poolId),
    prisma.membership.findMany({
      where: { poolId },
      select: {
        id: true,
        userId: true,
        nickname: true,
        status: true,
        role: true,
        isParticipant: true,
        user: {
          select: { id: true, email: true, phoneE164: true, notifyPref: true },
        },
      },
    }),
    prisma.pick.findMany({
      where: { weekId: week.id },
      select: { membershipId: true, teamAbbr: true, result: true },
    }),
    findWeekTouchdownVideo(weekNumber, {
      seasonYear: Number.isFinite(seasonYear) ? seasonYear : undefined,
    }).catch(() => null),
  ]);
  const content = weekWrapContent({
    tone: settings.tone,
    blocks: settings.blocks,
    facts: {
      weekNumber,
      players: weekWrapPlayers(members, picks),
      boardUrl: WEEK_WRAP_BOARD_URL,
    },
    emailOverride: settings.emailOverride,
    smsOverride: settings.smsOverride,
    touchdown,
  });
  const counts = { sent: 0, skipped: 0, already: 0 };
  const seen = new Set<string>();
  for (const member of members) {
    if (seen.has(member.userId)) continue;
    seen.add(member.userId);
    const result = await notifyUser({
      target: {
        userId: member.user.id,
        email: member.user.email,
        phoneE164: member.user.phoneE164,
        notifyPref: member.user.notifyPref,
        nickname: member.nickname,
      },
      type: "weekWrap",
      content,
      dedupeKey: weekWrapDedupeKey(poolId, weekNumber),
    });
    if (result.emailed || result.texted) counts.sent += 1;
    else if (result.skipped == null) counts.already += 1;
    else counts.skipped += 1;
  }
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
      }),
    },
  });
  return { ok: true, counts };
}
