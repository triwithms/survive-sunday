import { prisma } from "./db";
import {
  announcementCopy,
  notifyInBackground,
  notifyUser,
  pickConfirmedCopy,
  resultsCopy,
  scoreUpdateCopy,
  type NotifyTarget,
} from "./notify";

function targetFrom(user: {
  id: string;
  email: string | null;
  phoneE164?: string | null;
  notifyPref?: string | null;
}, nickname?: string | null): NotifyTarget {
  return {
    userId: user.id,
    email: user.email,
    phoneE164: user.phoneE164,
    notifyPref: user.notifyPref,
    nickname,
  };
}

export function schedulePickConfirmed(opts: {
  user: { id: string; email: string | null; phoneE164?: string | null };
  nickname: string;
  weekNumber: number;
  weekId: string;
  teamAbbr: string;
  changed: boolean;
}): void {
  notifyInBackground(async () => {
    const content = pickConfirmedCopy(opts);
    await notifyUser({
      target: targetFrom(opts.user, opts.nickname),
      type: "pickConfirmed",
      content,
      dedupeKey: `${opts.weekId}:${opts.teamAbbr}:${opts.changed ? "changed" : "saved"}:${Date.now()}`,
    });
  });
}

export function scheduleResultsNotice(opts: {
  user: { id: string; email: string | null; phoneE164?: string | null };
  nickname: string;
  weekNumber: number;
  weekId: string;
  pickId: string;
  teamAbbr: string;
  result: "win" | "loss" | "push" | "missed";
  status?: string | null;
  mulliganBurned?: boolean;
}): void {
  notifyInBackground(async () => {
    const content = resultsCopy(opts);
    const sendResults = opts.result === "win" || opts.result === "loss" || opts.result === "push" || opts.result === "missed";
    const sendOut =
      Boolean(opts.mulliganBurned) || opts.status === "eliminated";

    if (sendResults) {
      await notifyUser({
        target: targetFrom(opts.user, opts.nickname),
        type: "resultsGraded",
        content,
        dedupeKey: `${opts.weekId}:${opts.pickId}:${opts.result}`,
      });
    }
    if (sendOut) {
      await notifyUser({
        target: targetFrom(opts.user, opts.nickname),
        type: "eliminationMulligan",
        content,
        dedupeKey: `${opts.weekId}:${opts.pickId}:${opts.status ?? "status"}`,
      });
    }
  });
}

export function scheduleScoreUpdate(opts: {
  user: { id: string; email: string | null };
  nickname: string;
  weekNumber: number;
  gameId: string;
  teamAbbr: string;
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel?: string | null;
}): void {
  notifyInBackground(async () => {
    await notifyUser({
      target: targetFrom(opts.user, opts.nickname),
      type: "scoreUpdates",
      content: scoreUpdateCopy(opts),
      dedupeKey: `${opts.gameId}:live`,
    });
  });
}

export async function sendPoolAnnouncement(opts: {
  poolId: string;
  actorId: string;
  message: string;
}): Promise<{ sent: number; skipped: number }> {
  const members = await prisma.membership.findMany({
    where: { poolId: opts.poolId },
    include: { user: true },
  });
  const seen = new Set<string>();
  let sent = 0;
  let skipped = 0;
  const stamp = new Date().toISOString();
  for (const m of members) {
    if (seen.has(m.userId)) continue;
    seen.add(m.userId);
    const result = await notifyUser({
      target: targetFrom(m.user, m.nickname),
      type: "poolAnnouncements",
      content: announcementCopy({
        nickname: m.nickname,
        message: opts.message,
      }),
      dedupeKey: `announce:${stamp}:${m.userId}`,
    });
    if (result.emailed) sent += 1;
    else skipped += 1;
  }
  await prisma.auditLog.create({
    data: {
      poolId: opts.poolId,
      actorId: opts.actorId,
      action: "pool_announcement",
      targetType: "pool",
      targetId: opts.poolId,
      details: JSON.stringify({ sent, skipped, chars: opts.message.length }),
    },
  });
  return { sent, skipped };
}
