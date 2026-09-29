/**
 * Entry-fee labels. No money moves. No card or bank numbers.
 * Pure helpers — safe for the verify script and for client UI.
 */
import type { NotifyContent } from "./notification-copy";
import {
  noticeCounts,
  type NoticeCounts,
  type NoticePerson,
} from "./notice-audience";
import { toGsm7, TRIAL_SMS_MAX } from "./sms-gsm";

export const PAYMENT_STATUSES = ["unpaid", "paid", "waived"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Pool notes preference. Same send path as other game notices. */
export const ENTRY_FEE_NOTICE = "poolAnnouncements";

export const INSTRUCTIONS_MAX = 280;
export const NOTE_MAX = 120;
export const LINK_MAX = 500;
const FEE_CENTS_MAX = 10_000_000;

const STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  waived: "Waived",
};

export function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    typeof value === "string" &&
    (PAYMENT_STATUSES as readonly string[]).includes(value)
  );
}

export function paymentStatusLabel(status: string): string {
  return isPaymentStatus(status) ? STATUS_LABEL[status] : "Unpaid";
}

/** Chip, Unpaid filter, This Week card, and the player line. Off = none of these. */
export function paymentUiWhen(enabled: boolean): {
  chip: boolean;
  filter: boolean;
  card: boolean;
  playerLine: boolean;
} {
  return {
    chip: enabled,
    filter: enabled,
    card: enabled,
    playerLine: enabled,
  };
}

export function canSetPaymentStatus(
  adminPoolId: string,
  membershipPoolId: string
): boolean {
  return adminPoolId.length > 0 && adminPoolId === membershipPoolId;
}

/** A player may read only their own row. A requested id for someone else is refused. */
export function playerMayReadPayment(args: {
  viewerUserId: string;
  requestedUserId?: string | null;
}): boolean {
  if (!args.viewerUserId) return false;
  if (args.requestedUserId && args.requestedUserId !== args.viewerUserId) {
    return false;
  }
  return true;
}

export type PlayerEntryFee =
  | { enabled: false }
  | {
      enabled: true;
      status: PaymentStatus;
      instructions: string | null;
      link: string | null;
    };

export function entryFeeForViewer(
  viewerUserId: string,
  row: {
    userId: string;
    enabled: boolean;
    status: string;
    instructions: string | null;
    link: string | null;
  }
): PlayerEntryFee | null {
  if (!playerMayReadPayment({ viewerUserId, requestedUserId: row.userId })) {
    return null;
  }
  if (!row.enabled) return { enabled: false };
  const link = parsePaymentLink(row.link);
  return {
    enabled: true,
    status: isPaymentStatus(row.status) ? row.status : "unpaid",
    instructions: row.instructions,
    link: link.ok ? link.value : null,
  };
}

export function playerEntryFeeLine(view: PlayerEntryFee | null): string | null {
  if (!view?.enabled) return null;
  if (view.status === "paid") return "Entry fee: Paid ✓";
  if (view.status === "waived") return "Entry fee: Waived";
  return "Entry fee: Unpaid — How to pay ›";
}

/** 13–19 digits, ignoring spaces and dashes. Blocks a pasted card number. */
export function looksLikeCardNumber(text: string): boolean {
  return /(?:\d[ -]?){13,19}/.test(text);
}

export function parsePaymentInstructions(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, error: "How to pay must be plain text." };
  }
  const text = raw.trim();
  if (!text) return { ok: true, value: null };
  if (text.length > INSTRUCTIONS_MAX) {
    return { ok: false, error: `How to pay must be ${INSTRUCTIONS_MAX} characters or fewer.` };
  }
  if (looksLikeCardNumber(text)) {
    return {
      ok: false,
      error: "Don’t put a card or bank number here. Write how to pay in plain words.",
    };
  }
  return { ok: true, value: text };
}

export function parsePaymentNote(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, error: "Note must be plain text." };
  }
  const text = raw.trim();
  if (!text) return { ok: true, value: null };
  if (text.length > NOTE_MAX) {
    return { ok: false, error: `Note must be ${NOTE_MAX} characters or fewer.` };
  }
  if (looksLikeCardNumber(text)) {
    return {
      ok: false,
      error: "Don’t put a card or bank number in the note.",
    };
  }
  return { ok: true, value: text };
}

export function parsePaymentLink(
  raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: null };
  if (typeof raw !== "string") {
    return { ok: false, error: "Payment link must be an https link." };
  }
  const text = raw.trim();
  if (!text) return { ok: true, value: null };
  if (text.length > LINK_MAX) {
    return { ok: false, error: "Payment link is too long." };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "Payment link must be an https link." };
  }
  if (url.protocol !== "https:") {
    return { ok: false, error: "Payment link must be an https link." };
  }
  if (!url.hostname) {
    return { ok: false, error: "Payment link must be an https link." };
  }
  return { ok: true, value: url.toString() };
}

export function parseEntryFeeCents(
  raw: unknown
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw == null || raw === "") return { ok: true, value: null };
  const text = typeof raw === "number" ? String(raw) : raw;
  if (typeof text !== "string") {
    return { ok: false, error: "Entry fee must be a dollar amount." };
  }
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: null };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Entry fee must be a dollar amount, like 20 or 20.00." };
  }
  const cents = Math.round(Number(trimmed) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > FEE_CENTS_MAX) {
    return { ok: false, error: "Entry fee is too large." };
  }
  return { ok: true, value: cents };
}

export function parseEntryFeeCurrency(raw: unknown): string {
  if (typeof raw !== "string") return "CAD";
  const text = raw.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(text)) return "CAD";
  return text;
}

export function formatEntryMoney(cents: number, currency: string): string {
  const dollars = cents / 100;
  const num = Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
  if (currency === "CAD" || currency === "USD") return `$${num}`;
  return `${num} ${currency}`;
}

export function entryFeeTotals(
  rows: { paymentStatus: string }[],
  feeCents: number | null
): {
  paid: number;
  unpaid: number;
  waived: number;
  expectedCount: number;
  collectedCents: number | null;
  expectedCents: number | null;
} {
  let paid = 0;
  let unpaid = 0;
  let waived = 0;
  for (const row of rows) {
    if (row.paymentStatus === "paid") paid += 1;
    else if (row.paymentStatus === "waived") waived += 1;
    else unpaid += 1;
  }
  const expectedCount = paid + unpaid;
  return {
    paid,
    unpaid,
    waived,
    expectedCount,
    collectedCents: feeCents == null ? null : paid * feeCents,
    expectedCents: feeCents == null ? null : expectedCount * feeCents,
  };
}

export function entryFeeSummaryLine(
  rows: { paymentStatus: string }[],
  feeCents: number | null,
  currency: string
): string {
  const totals = entryFeeTotals(rows, feeCents);
  const head = `Paid ${totals.paid} of ${totals.expectedCount}`;
  if (
    feeCents == null ||
    totals.collectedCents == null ||
    totals.expectedCents == null
  ) {
    return head;
  }
  return `${head} · ${formatEntryMoney(totals.collectedCents, currency)} of ${formatEntryMoney(totals.expectedCents, currency)} collected`;
}

export function unpaidReminderSeats<T extends { paymentStatus: string }>(
  seats: T[]
): T[] {
  return seats.filter((seat) => seat.paymentStatus === "unpaid");
}

export function unpaidReminderCounts(
  seats: (NoticePerson & { paymentStatus: string })[]
): NoticeCounts {
  return noticeCounts(unpaidReminderSeats(seats), ENTRY_FEE_NOTICE);
}

const SMS_HEAD = "Survive Sunday: your ";
const SMS_TAIL =
  " entry fee is still open. How to pay is in the app under Account. Already paid? Tell your Administrator.";

/** ≤160 GSM-7. No amount, no link, no how-to-pay text. */
export function entryFeeSms(poolName: string): string {
  const name = toGsm7(poolName).replace(/\s+/g, " ").trim() || "pool";
  const full = `${SMS_HEAD}${name}${SMS_TAIL}`;
  if (full.length <= TRIAL_SMS_MAX) return full;
  const room = TRIAL_SMS_MAX - SMS_HEAD.length - SMS_TAIL.length;
  const short = room > 0 ? name.slice(0, room).trim() : "pool";
  return `${SMS_HEAD}${short || "pool"}${SMS_TAIL}`;
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function entryFeeEmail(opts: {
  nickname: string;
  poolName: string;
  instructions: string | null;
  link: string | null;
}): NotifyContent {
  const nickname = oneLine(opts.nickname) || "friend";
  const poolName = oneLine(opts.poolName) || "your pool";
  const bits = [opts.instructions?.trim(), opts.link?.trim()].filter(
    (bit): bit is string => Boolean(bit)
  );
  const middle = bits.length ? ` ${bits.join(" ")}` : "";
  const text =
    `Hi ${nickname}, a friendly reminder from your pool Administrator that your entry fee for ${poolName} is still open.${middle} Already paid? Let your Administrator know and they'll mark it. This app never handles money.`;
  const link = opts.link?.trim();
  const linkHtml = link
    ? ` <a href="${escapeHtml(link)}">${escapeHtml(link)}</a>`
    : "";
  const instructionsHtml = opts.instructions?.trim()
    ? ` ${escapeHtml(opts.instructions.trim())}`
    : "";
  return {
    subject: `Survive Sunday: entry fee reminder for ${poolName}`,
    text,
    htmlBody: `<p style="margin:0;">${escapeHtml(
      `Hi ${nickname}, a friendly reminder from your pool Administrator that your entry fee for ${poolName} is still open.`
    )}${instructionsHtml}${linkHtml} ${escapeHtml(
      "Already paid? Let your Administrator know and they'll mark it. This app never handles money."
    )}</p>`,
    smsBody: entryFeeSms(poolName),
  };
}

export function markedPaymentLabel(status: string, at: Date): string | null {
  if (status !== "paid" && status !== "waived") return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const period = get("dayPeriod").replace(/\./g, "").toUpperCase();
  const verb = status === "paid" ? "paid" : "waived";
  return `Marked ${verb} ${get("month")} ${get("day")}, ${get("hour")}:${get("minute")} ${period}`;
}

export type EntryFeeSettings = {
  enabled: boolean;
  entryFeeCents: number | null;
  currency: string;
  instructions: string | null;
  link: string | null;
};

export function settingsChangeAudit(before: EntryFeeSettings, after: EntryFeeSettings) {
  const turned = `${before.enabled ? "on" : "off"} → ${after.enabled ? "on" : "off"}`;
  const fee =
    after.entryFeeCents == null
      ? "no amount"
      : formatEntryMoney(after.entryFeeCents, after.currency);
  return {
    summary: `Entry fees ${turned} · ${fee}`,
    before,
    after,
  };
}

export function statusChangeAudit(args: {
  nickname: string;
  beforeStatus: string;
  afterStatus: string;
  beforeNote: string | null;
  afterNote: string | null;
}) {
  return {
    summary: `${args.nickname}: ${paymentStatusLabel(args.beforeStatus)} → ${paymentStatusLabel(args.afterStatus)}`,
    before: { status: args.beforeStatus, note: args.beforeNote },
    after: { status: args.afterStatus, note: args.afterNote },
  };
}

export function reminderAudit(args: {
  reminded: number;
  skipped: number;
  nicknames: string[];
}) {
  const who = args.nicknames.length ? args.nicknames.join(", ") : "none";
  return {
    summary: `${args.reminded} reminded, ${args.skipped} skipped. ${who}`,
    reminded: args.reminded,
    skipped: args.skipped,
    nicknames: args.nicknames,
  };
}
