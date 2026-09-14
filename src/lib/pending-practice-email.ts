import type { PrismaClient } from "@prisma/client";
import {
  isPendingPlaceholderEmail,
  practiceEmailFromPlaceholder,
} from "./pool-mode";

export const PENDING_PRACTICE_EMAIL_AUDIT = "pending_practice_emails_restored";

/** Real claimed login — never convert this back to a practice address. */
export const CLAIMED_GAMS_EMAIL = "robertgama@gmail.com";

export type PendingRestoreRow = {
  userId: string;
  nickname: string | null;
  from: string;
  to: string;
};

export type PendingRestorePlan =
  | { action: "rename"; from: string; to: string }
  | { action: "skip"; reason: string };

/**
 * Decide whether this user row should move from a pending placeholder
 * to `@survivesunday.demo`. Does not write to the database.
 */
export function planPendingPracticeRestore(args: {
  email: string | null | undefined;
  targetTakenByUserId?: string | null;
  userId: string;
}): PendingRestorePlan {
  const from = (args.email ?? "").trim();
  if (!from) return { action: "skip", reason: "empty" };
  if (from.toLowerCase() === CLAIMED_GAMS_EMAIL) {
    return { action: "skip", reason: "claimed-gams" };
  }
  if (!isPendingPlaceholderEmail(from)) {
    return { action: "skip", reason: "not-pending" };
  }
  const to = practiceEmailFromPlaceholder(from);
  if (!to) return { action: "skip", reason: "no-target" };
  if (args.targetTakenByUserId && args.targetTakenByUserId !== args.userId) {
    return { action: "skip", reason: "target-taken" };
  }
  return { action: "rename", from, to };
}

export type PendingRestoreResult = {
  updated: PendingRestoreRow[];
  skipped: { email: string; reason: string }[];
};

/**
 * Convert leftover `@pending.survivesunday.local` (and similar) users
 * back to `@survivesunday.demo` practice emails. Nicknames, real names,
 * and picks stay on the same membership/user rows.
 *
 * Does not touch real claimed logins (including Gams / robertgama@gmail.com).
 */
export async function restorePendingPracticeEmails(
  db: PrismaClient,
  poolId: string
): Promise<PendingRestoreResult> {
  const members = await db.membership.findMany({
    where: { poolId },
    select: {
      nickname: true,
      user: { select: { id: true, email: true } },
    },
  });

  const updated: PendingRestoreRow[] = [];
  const skipped: PendingRestoreResult["skipped"] = [];

  for (const member of members) {
    const from = member.user.email;
    const target = practiceEmailFromPlaceholder(from);
    let takenBy: string | null = null;
    if (target) {
      const existing = await db.user.findUnique({
        where: { email: target },
        select: { id: true },
      });
      takenBy = existing?.id ?? null;
    }

    const plan = planPendingPracticeRestore({
      email: from,
      userId: member.user.id,
      targetTakenByUserId: takenBy,
    });
    if (plan.action === "skip") {
      if (from && isPendingPlaceholderEmail(from)) {
        skipped.push({ email: from, reason: plan.reason });
      }
      continue;
    }

    await db.user.update({
      where: { id: member.user.id },
      data: { email: plan.to },
    });
    updated.push({
      userId: member.user.id,
      nickname: member.nickname,
      from: plan.from,
      to: plan.to,
    });
  }

  if (updated.length > 0) {
    await db.auditLog.create({
      data: {
        poolId,
        action: PENDING_PRACTICE_EMAIL_AUDIT,
        targetType: "pool",
        targetId: poolId,
        details: JSON.stringify({
          updated,
          skipped,
          note: "Pending placeholder emails restored to practice @survivesunday.demo",
        }),
      },
    });
  }

  return { updated, skipped };
}
