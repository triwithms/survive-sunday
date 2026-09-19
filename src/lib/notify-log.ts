import { prisma } from "./db";
import type { NotifyOutcome } from "./notify-plan";

/** Idempotency row. Duplicate unique key → false. */
export async function claimNotificationSend(
  userId: string,
  type: string,
  dedupeKey: string,
  channel: string,
  outcome: NotifyOutcome = "sent"
): Promise<boolean> {
  try {
    await prisma.notificationSend.create({
      data: { userId, type, dedupeKey, channel, outcome },
    });
    return true;
  } catch {
    return false;
  }
}

export function logNotifyOutcome(opts: {
  userId: string;
  type: string;
  channel: string;
  outcome: NotifyOutcome;
}): void {
  console.info(
    `[notify] type=${opts.type} channel=${opts.channel} outcome=${opts.outcome} user=${opts.userId}`
  );
}
