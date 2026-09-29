import "server-only";
import { prisma } from "./db";
import { channelsOf, prefsFromRow } from "./notify-pref-columns";
import { notifyUser } from "./notify";
import type { NoticeCounts, NoticePerson } from "./notice-audience";
import { noticeCounts } from "./notice-audience";
import {
  ENTRY_FEE_NOTICE,
  entryFeeEmail,
  parsePaymentInstructions,
  parsePaymentLink,
  reminderAudit,
  unpaidReminderSeats,
} from "./payment-tracking";

function parsedInstructions(raw: string | null): string | null {
  const parsed = parsePaymentInstructions(raw);
  return parsed.ok ? parsed.value : null;
}

function parsedLink(raw: string | null): string | null {
  const parsed = parsePaymentLink(raw);
  return parsed.ok ? parsed.value : null;
}

type FeeSeat = NoticePerson & {
  membershipId: string;
  paymentStatus: string;
};

export type UnpaidFeePanelData = {
  count: number;
  plan: NoticeCounts;
};

async function loadFeeSeats(poolId: string): Promise<FeeSeat[]> {
  const rows = await prisma.membership.findMany({
    where: { poolId, isParticipant: true, role: { not: "admin" } },
    select: {
      id: true,
      userId: true,
      nickname: true,
      paymentStatus: true,
      user: {
        select: {
          email: true,
          phoneE164: true,
          notifyPref: true,
          notificationPreference: {
            select: { masterOn: true, channelsJson: true },
          },
        },
      },
    },
    orderBy: { nickname: "asc" },
  });
  return rows.map((row) => {
    const prefs = prefsFromRow(row.user.notificationPreference);
    return {
      membershipId: row.id,
      userId: row.userId,
      nickname: row.nickname,
      paymentStatus: row.paymentStatus,
      email: row.user.email,
      phoneE164: row.user.phoneE164,
      notifyPref: row.user.notifyPref,
      masterOn: prefs.masterOn,
      channels: channelsOf(prefs),
    };
  });
}

/** Null when tracking is off — the This Week card stays hidden. */
export async function loadUnpaidFeePanel(
  poolId: string
): Promise<UnpaidFeePanelData | null> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { paymentTrackingEnabled: true },
  });
  if (!pool?.paymentTrackingEnabled) return null;
  const unpaid = unpaidReminderSeats(await loadFeeSeats(poolId));
  return {
    count: unpaid.length,
    plan: noticeCounts(unpaid, ENTRY_FEE_NOTICE),
  };
}

export async function sendEntryFeeReminders(opts: {
  poolId: string;
  actorId: string;
  now?: Date;
}): Promise<
  | { ok: true; reminded: number; skipped: number; nicknames: string[] }
  | { ok: false; error: string }
> {
  const pool = await prisma.pool.findUnique({
    where: { id: opts.poolId },
    select: {
      name: true,
      paymentTrackingEnabled: true,
      paymentInstructions: true,
      paymentLink: true,
    },
  });
  if (!pool?.paymentTrackingEnabled) {
    return { ok: false, error: "Entry fees are off for this pool." };
  }
  const stamp = (opts.now ?? new Date()).toISOString();
  const unpaid = unpaidReminderSeats(await loadFeeSeats(opts.poolId));
  let reminded = 0;
  let skipped = 0;
  const nicknames: string[] = [];
  for (const seat of unpaid) {
    const still = await prisma.membership.findFirst({
      where: {
        id: seat.membershipId,
        poolId: opts.poolId,
        paymentStatus: "unpaid",
      },
      select: { id: true },
    });
    if (!still) {
      skipped += 1;
      continue;
    }
    const result = await notifyUser({
      target: {
        userId: seat.userId,
        email: seat.email,
        phoneE164: seat.phoneE164,
        notifyPref: seat.notifyPref,
        nickname: seat.nickname,
      },
      type: ENTRY_FEE_NOTICE,
      content: entryFeeEmail({
        nickname: seat.nickname,
        poolName: pool.name,
        instructions: parsedInstructions(pool.paymentInstructions),
        link: parsedLink(pool.paymentLink),
      }),
      dedupeKey: `entry-fee:${opts.poolId}:${stamp}`,
    });
    if (result.emailed || result.texted) {
      reminded += 1;
      nicknames.push(seat.nickname);
    } else {
      skipped += 1;
    }
  }
  const audit = reminderAudit({ reminded, skipped, nicknames });
  await prisma.auditLog.create({
    data: {
      poolId: opts.poolId,
      actorId: opts.actorId,
      action: "entry_fee_reminders",
      targetType: "pool",
      targetId: opts.poolId,
      details: JSON.stringify(audit),
    },
  });
  return { ok: true, reminded, skipped, nicknames };
}
