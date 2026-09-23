import type { NotifyContent } from "./notification-copy";
import {
  GAME_SMS_FOOTER,
  withGameEmailHtml,
  withGameEmailText,
  withGameSmsFooter,
} from "./notify-game-footer";
import { sectionLines, weekWrapShortText } from "./week-wrap-sections";
import { WEEK_WRAP_DRAMA_PLACEHOLDER, weekWrapIntro, weekWrapSubject } from "./week-wrap-tone";
import type { TouchdownClip } from "./week-wrap-touchdown";
import {
  emailTextWithTouchdown,
  smsWithTouchdown,
  touchdownEmailHtml,
} from "./week-wrap-touchdown-html";
import type { WeekWrapBlocks, WeekWrapFacts, WeekWrapTone } from "./week-wrap-types";

const SMS_LIMIT = 1500;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailBody(opts: {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
}): string {
  if (opts.tone === "short") return weekWrapShortText(opts.facts, opts.blocks);
  const lines = [weekWrapIntro(opts.tone, opts.facts.weekNumber), ...sectionLines(opts.facts, opts.blocks)];
  if (opts.tone === "funny" && opts.blocks.drama) lines.push(WEEK_WRAP_DRAMA_PLACEHOLDER);
  return lines.join("\n");
}

function toHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => `<p style="margin:0 0 8px;">${escapeHtml(line) || "&nbsp;"}</p>`)
    .join("");
}

function smsWithPrefs(body: string, clip: TouchdownClip | null): string {
  const withClip = smsWithTouchdown(body, clip);
  const full = withGameSmsFooter(withClip);
  if (full.length <= SMS_LIMIT) return full;
  const tip = `\n${GAME_SMS_FOOTER}`;
  const room = Math.max(0, SMS_LIMIT - tip.length);
  return `${withClip.slice(0, room).trimEnd()}${tip}`;
}

/** Template copy. SMS is short facts. No live model. */
export function weekWrapContent(opts: {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
  emailOverride?: string;
  smsOverride?: string;
  touchdown?: TouchdownClip | null;
}): NotifyContent {
  const email = (opts.emailOverride ?? "").trim();
  const sms = (opts.smsOverride ?? "").trim();
  const clip = opts.touchdown ?? null;
  const base = email || emailBody(opts);
  const text = emailTextWithTouchdown(base, clip);
  return {
    subject: weekWrapSubject(opts.tone, opts.facts.weekNumber),
    text: withGameEmailText(text),
    htmlBody: withGameEmailHtml(toHtml(base) + touchdownEmailHtml(clip)),
    smsBody: smsWithPrefs(sms || weekWrapShortText(opts.facts, opts.blocks), clip),
  };
}
