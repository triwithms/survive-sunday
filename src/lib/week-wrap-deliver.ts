import { prisma } from "./db";
import type { NotifyContent } from "./notification-copy";
import { notifyUser } from "./notify";
import { weekWrapDedupeKey } from "./week-wrap-types";

export type WeekWrapSendCounts = {
  sent: number;
  skipped: number;
  already: number;
};

export function weekWrapSendMessage(counts: WeekWrapSendCounts): string {
  return `Sent ${counts.sent} · already sent ${counts.already} · not delivered ${counts.skipped}`;
}

const memberSelect = {
  id: true,
  userId: true,
  nickname: true,
  status: true,
  role: true,
  isParticipant: true,
  user: {
    select: { id: true, email: true, phoneE164: true, notifyPref: true },
  },
} as const;

export async function loadWrapMembers(poolId: string) {
  return prisma.membership.findMany({ where: { poolId }, select: memberSelect });
}

export async function notifyWrapMembers(
  members: Awaited<ReturnType<typeof loadWrapMembers>>,
  content: NotifyContent,
  poolId: string,
  weekNumber: number
): Promise<WeekWrapSendCounts> {
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
  return counts;
}
