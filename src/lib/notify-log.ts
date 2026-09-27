import { prisma } from "./db";
import type { NotifyOutcome } from "./notify-plan";
import { recordServerError } from "./server-error-log";
import { claimedFreshRow, isUniqueConflict } from "./unique-conflict";

/**
 * Idempotency row. True only when this call inserted it.
 * A duplicate is "already sent" — callers must not email or text again.
 * `createMany` + `skipDuplicates` does not throw on the unique key, so Prisma
 * does not log `prisma:error` and the conflict cannot escape into a page.
 */
export async function claimNotificationSend(
  userId: string,
  type: string,
  dedupeKey: string,
  channel: string,
  outcome: NotifyOutcome = "sent"
): Promise<boolean> {
  try {
    const inserted = await prisma.notificationSend.createMany({
      data: [{ userId, type, dedupeKey, channel, outcome }],
      skipDuplicates: true,
    });
    return claimedFreshRow(inserted.count);
  } catch (error) {
    if (isUniqueConflict(error)) return false;
    console.error("[notify] claim failed", error);
    const message = error instanceof Error ? error.message : String(error);
    void recordServerError({
      route: "notify.claim",
      message,
      source: "notify",
    });
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
