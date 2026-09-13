import "server-only";
import { prisma } from "./db";
import { effectiveLockAt, isWeekLocked } from "./grading";
import { missingPickCopy, notifyUser } from "./notify";
import { isMissingPickReminderWindow } from "./notification-types";
import { isPlayerSeat } from "./roles";

export async function sendMissingPickReminders(opts?: {
  poolId?: string;
  now?: Date;
}): Promise<{ reminded: number; skipped: number }> {
  const now = opts?.now ?? new Date();
  const weeks = await prisma.week.findMany({
    where: {
      status: { in: ["open"] },
      ...(opts?.poolId ? { poolId: opts.poolId } : {}),
    },
    include: {
      pool: {
        include: { memberships: { include: { user: true, picks: true } } },
      },
      picks: true,
    },
  });

  let reminded = 0;
  let skipped = 0;
  for (const week of weeks) {
    if (isWeekLocked(week)) continue;
    const lockAt = effectiveLockAt(week);
    if (!isMissingPickReminderWindow(lockAt, now)) continue;
    const picked = new Set(week.picks.map((p) => p.membershipId));
    const lockLabel = lockAt.toLocaleString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Toronto",
    });
    for (const m of week.pool.memberships) {
      if (!isPlayerSeat(m)) continue;
      if (m.status === "eliminated") continue;
      if (picked.has(m.id)) continue;
      const result = await notifyUser({
        target: {
          userId: m.user.id,
          email: m.user.email,
          phoneE164: m.user.phoneE164,
          nickname: m.nickname,
        },
        type: "missingPickReminder",
        content: missingPickCopy({
          nickname: m.nickname,
          weekNumber: week.number,
          lockLabel,
        }),
        dedupeKey: week.id,
        alsoSms: true,
      });
      if (result.emailed || result.texted) reminded += 1;
      else skipped += 1;
    }
  }
  return { reminded, skipped };
}
