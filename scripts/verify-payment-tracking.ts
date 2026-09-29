/**
 * Entry-fee labels. No database. No money moves.
 *
 *   npx tsx scripts/verify-payment-tracking.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { remindConfirmLine } from "../src/lib/notice-audience";
import {
  canSetPaymentStatus,
  entryFeeEmail,
  entryFeeForViewer,
  entryFeeSms,
  entryFeeSummaryLine,
  entryFeeTotals,
  looksLikeCardNumber,
  markedPaymentLabel,
  parsePaymentInstructions,
  parsePaymentLink,
  paymentUiWhen,
  playerEntryFeeLine,
  playerMayReadPayment,
  settingsChangeAudit,
  statusChangeAudit,
  unpaidReminderCounts,
} from "../src/lib/payment-tracking";
import { toGsm7, TRIAL_SMS_MAX } from "../src/lib/sms-gsm";

function src(path: string): string {
  return readFileSync(path, "utf8");
}

const off = paymentUiWhen(false);
assert.equal(off.chip, false, "default off: no chip");
assert.equal(off.filter, false, "default off: no unpaid filter");
assert.equal(off.card, false, "default off: no unpaid card");
assert.equal(off.playerLine, false, "default off: no player line");
assert.equal(playerEntryFeeLine({ enabled: false }), null);
assert.equal(
  playerEntryFeeLine(
    entryFeeForViewer("me", {
      userId: "me",
      enabled: false,
      status: "unpaid",
      instructions: "e-Transfer",
      link: null,
    })
  ),
  null
);

const on = paymentUiWhen(true);
assert.equal(on.chip && on.filter && on.card && on.playerLine, true);

const roster = src("src/components/features/admin/RosterRow.tsx");
assert.match(roster, /tracking \?/);
assert.match(roster, /PaymentStatusChip/);
assert.match(roster, /MarkPaidButton/);
assert.match(src("src/components/features/admin/MarkPaidButton.tsx"), /Mark paid/);
const filters = src("src/components/features/admin/RosterFilters.tsx");
assert.match(filters, /showUnpaid/);
assert.match(filters, /Unpaid \(\$\{props\.counts\.unpaid\}\)/);
const system = src("src/components/features/admin/SystemScreen.tsx");
assert.match(system, /props\.unpaidFees \?/);
assert.match(system, /UnpaidFeesPanel/);
assert.match(src("src/components/features/admin/load-system.ts"), /loadUnpaidFeePanel/);
assert.match(src("src/lib/payment-remind.ts"), /if \(!pool\?\.paymentTrackingEnabled\) return null/);
const player = src("src/components/features/account/EntryFeeLine.tsx");
assert.match(player, /if \(!line \|\| !fee\?\.enabled\) return null/);
assert.doesNotMatch(player, /findMany|other player/);

assert.equal(canSetPaymentStatus("pool-a", "pool-b"), false);
assert.equal(canSetPaymentStatus("pool-a", "pool-a"), true);
assert.equal(canSetPaymentStatus("", "pool-a"), false);
const statusRoute = src("src/app/api/admin/entry-fee-status/route.ts");
assert.match(statusRoute, /canSetPaymentStatus/);
assert.match(statusRoute, /poolId/);
assert.match(statusRoute, /where: \{ id: membershipId, poolId \}/);
const settingsRoute = src("src/app/api/admin/entry-fees/route.ts");
assert.match(settingsRoute, /admin\.membership\.poolId/);
assert.doesNotMatch(settingsRoute, /findMany\(\s*\{/);

assert.equal(
  playerMayReadPayment({ viewerUserId: "me", requestedUserId: "them" }),
  false
);
assert.equal(playerMayReadPayment({ viewerUserId: "me", requestedUserId: "me" }), true);
assert.equal(entryFeeForViewer("me", {
  userId: "them",
  enabled: true,
  status: "paid",
  instructions: "secret",
  link: "https://example.com/pay",
}), null);
const own = entryFeeForViewer("me", {
  userId: "me",
  enabled: true,
  status: "unpaid",
  instructions: "e-Transfer to a@b.com",
  link: "https://example.com/pay",
});
assert.equal(playerEntryFeeLine(own), "Entry fee: Unpaid — How to pay ›");
assert.equal(
  playerEntryFeeLine({
    enabled: true,
    status: "paid",
    instructions: null,
    link: null,
  }),
  "Entry fee: Paid ✓"
);
const accountRoute = src("src/app/api/account/entry-fee/route.ts");
assert.match(accountRoute, /playerMayReadPayment/);
assert.match(accountRoute, /entryFeeForViewer/);
assert.doesNotMatch(accountRoute, /findMany/);
assert.doesNotMatch(
  src("src/components/features/board/BoardScreen.tsx") +
    src("src/components/features/home/SelectionsList.tsx") +
    src("src/lib/week-wrap-copy.ts"),
  /paymentStatus|Entry fee|paymentTrackingEnabled/
);

const people = [
  {
    userId: "paid",
    nickname: "Paid",
    paymentStatus: "paid",
    email: "paid@example.com",
    masterOn: true,
    channels: { poolAnnouncements: "both" },
  },
  {
    userId: "waived",
    nickname: "Waived",
    paymentStatus: "waived",
    email: "waived@example.com",
    phoneE164: "+14165550100",
    masterOn: true,
    channels: { poolAnnouncements: "both" },
  },
  {
    userId: "mail",
    nickname: "Mail",
    paymentStatus: "unpaid",
    email: "mail@example.com",
    masterOn: true,
    channels: { poolAnnouncements: "email" },
  },
  {
    userId: "both",
    nickname: "Both",
    paymentStatus: "unpaid",
    email: "both@example.com",
    phoneE164: "+14165550101",
    masterOn: true,
    channels: { poolAnnouncements: "both" },
  },
  {
    userId: "off",
    nickname: "Off",
    paymentStatus: "unpaid",
    email: "off@example.com",
    phoneE164: "+14165550102",
    masterOn: false,
    channels: { poolAnnouncements: "both" },
  },
];
const counts = unpaidReminderCounts(people);
assert.equal(counts.email, 2, "paid and waived are not emailed");
assert.equal(counts.sms, 1);
assert.equal(counts.skippedOff, 1);
assert.deepEqual(counts.nicknames, ["Both", "Mail"]);
assert.equal(
  remindConfirmLine(counts),
  "Email 2 · SMS 1 · 1 skipped (notifications off)"
);
const remindUi = src("src/components/features/admin/UnpaidFeesPanel.tsx");
assert.match(remindUi, /remindConfirmLine\(props\.plan\)/);
assert.match(remindUi, /ConfirmSheet/);
assert.match(remindUi, /Remind unpaid/);
const remindLib = src("src/lib/payment-remind.ts");
assert.match(remindLib, /notifyUser/);
assert.match(remindLib, /unpaidReminderSeats/);
assert.match(remindLib, /paymentStatus: "unpaid"/);
assert.match(remindLib, /entry_fee_reminders/);

const audit = statusChangeAudit({
  nickname: "Amina",
  beforeStatus: "unpaid",
  afterStatus: "paid",
  beforeNote: null,
  afterNote: "cash at Sunday game",
});
assert.match(audit.summary, /Unpaid → Paid/);
assert.equal(audit.before.status, "unpaid");
assert.equal(audit.after.status, "paid");
assert.equal(audit.after.note, "cash at Sunday game");
assert.match(statusRoute, /statusChangeAudit/);
assert.match(statusRoute, /auditLog\.create/);
const settingsAudit = settingsChangeAudit(
  {
    enabled: false,
    entryFeeCents: null,
    currency: "CAD",
    instructions: null,
    link: null,
  },
  {
    enabled: true,
    entryFeeCents: 2000,
    currency: "CAD",
    instructions: "e-Transfer",
    link: "https://example.com/pay",
  }
);
assert.equal(settingsAudit.before.enabled, false);
assert.equal(settingsAudit.after.enabled, true);
assert.match(settingsRoute, /settingsChangeAudit/);

assert.equal(parsePaymentLink("http://example.com/pay").ok, false);
assert.equal(parsePaymentLink("javascript:alert(1)").ok, false);
assert.equal(parsePaymentLink("https://paypal.me/pool").ok, true);
assert.equal(parsePaymentLink("").ok, true);
assert.equal(parsePaymentLink("not a url").ok, false);
const instructions = parsePaymentInstructions("4111 1111 1111 1111");
assert.equal(instructions.ok, false);
assert.equal(looksLikeCardNumber("e-Transfer to a@b.com"), false);

const rows = [
  ...Array.from({ length: 9 }, () => ({ paymentStatus: "paid" })),
  ...Array.from({ length: 4 }, () => ({ paymentStatus: "unpaid" })),
];
assert.equal(
  entryFeeSummaryLine(rows, 2000, "CAD"),
  "Paid 9 of 13 · $180 of $260 collected"
);
const withWaived = [
  ...Array.from({ length: 2 }, () => ({ paymentStatus: "paid" })),
  { paymentStatus: "unpaid" },
  { paymentStatus: "waived" },
];
const totals = entryFeeTotals(withWaived, 2000);
assert.equal(totals.collectedCents, 4000);
assert.equal(totals.expectedCents, 6000, "waived excluded from expected");
assert.equal(totals.expectedCount, 3);
assert.equal(
  entryFeeSummaryLine(withWaived, null, "CAD"),
  "Paid 2 of 3"
);

const sms = entryFeeSms("Sunday Pool");
assert.equal(
  sms,
  "Survive Sunday: your Sunday Pool entry fee is still open. How to pay is in the app under Account. Already paid? Tell your Administrator."
);
assert.ok(sms.length <= TRIAL_SMS_MAX);
assert.equal(sms, toGsm7(sms));
assert.equal(sms.includes("$"), false);
assert.equal(sms.includes("http"), false);
const longSms = entryFeeSms("A".repeat(80));
assert.ok(longSms.length <= TRIAL_SMS_MAX);
assert.match(longSms, /Tell your Administrator\.$/);
const mail = entryFeeEmail({
  nickname: "Amina",
  poolName: "Sunday Pool",
  instructions: "e-Transfer to a@b.com",
  link: "https://example.com/pay",
});
assert.equal(mail.subject, "Survive Sunday: entry fee reminder for Sunday Pool");
assert.match(mail.text, /Hi Amina,/);
assert.match(mail.text, /e-Transfer to a@b.com/);
assert.match(mail.text, /https:\/\/example\.com\/pay/);
assert.match(mail.text, /This app never handles money/);
assert.equal(mail.smsBody, sms.replace("Sunday Pool", "Sunday Pool"));
assert.equal(mail.smsBody?.includes("e-Transfer"), false);

assert.equal(
  markedPaymentLabel("paid", new Date("2026-09-30T19:12:00.000Z")),
  "Marked paid Sep 30, 3:12 PM"
);

const schema = src("prisma/schema.prisma");
assert.match(schema, /paymentTrackingEnabled Boolean @default\(false\)/);
assert.match(schema, /paymentStatus\s+String\s+@default\("unpaid"\)/);
const migration = src(
  "prisma/migrations/20260929200000_entry_fee_payment_tracking/migration.sql"
);
assert.match(migration, /ADD COLUMN IF NOT EXISTS "paymentTrackingEnabled"/);
assert.match(migration, /DEFAULT false/);
assert.match(migration, /ADD COLUMN IF NOT EXISTS "paymentStatus"/);
const sqlOnly = migration.replace(/--.*$/gm, "");
assert.doesNotMatch(sqlOnly, /\bUPDATE\b|\bDELETE\b/);
assert.match(src("src/components/features/help/HelpForAdmins.tsx"), /never\s+handles money/);
assert.doesNotMatch(src("src/components/features/help/HelpForAdmins.tsx"), /Commissioner/);
assert.match(src(".github/workflows/verify.yml"), /verify:payment-tracking/);

console.log("verify-payment-tracking OK");
