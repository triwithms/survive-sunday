import { isWeekWrapTone, parseWeekWrapBlocks } from "./week-wrap-parse";
import type { WeekWrapBlocks, WeekWrapTone } from "./week-wrap-types";

export type WeekWrapRequest = {
  action: "save" | "send" | "skip";
  weekNumber: number;
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  emailOverride: string;
  smsOverride: string;
};

const EMAIL_MAX = 4000;
const SMS_MAX = 500;

export function parseWeekWrapRequest(
  body: unknown
): { ok: true; value: WeekWrapRequest } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request" };
  }
  const row = body as Record<string, unknown>;
  const action = row.action;
  if (action !== "save" && action !== "send" && action !== "skip") {
    return { ok: false, error: "Choose save, send, or skip" };
  }
  const weekNumber = row.weekNumber;
  if (
    typeof weekNumber !== "number" ||
    !Number.isInteger(weekNumber) ||
    weekNumber < 1 ||
    weekNumber > 30
  ) {
    return { ok: false, error: "Pick a week" };
  }
  if (!isWeekWrapTone(row.tone)) {
    return { ok: false, error: "Choose Funny, Straight facts, or Short" };
  }
  const emailOverride =
    typeof row.emailOverride === "string" ? row.emailOverride.trim() : "";
  const smsOverride =
    typeof row.smsOverride === "string" ? row.smsOverride.trim() : "";
  if (emailOverride.length > EMAIL_MAX) {
    return { ok: false, error: "Email override is too long" };
  }
  if (smsOverride.length > SMS_MAX) {
    return { ok: false, error: "SMS override is too long" };
  }
  return {
    ok: true,
    value: {
      action,
      weekNumber,
      tone: row.tone,
      blocks: parseWeekWrapBlocks(row.blocks),
      emailOverride,
      smsOverride,
    },
  };
}
