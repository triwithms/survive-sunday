import type { NotifyContent } from "./notification-copy";
import {
  withGameEmailHtml,
  withGameEmailText,
  withGameSmsFooter,
} from "./notify-game-footer";
import { TRIAL_SMS_MAX, toGsm7 } from "./sms-gsm";
import { sectionLines, weekWrapShortText } from "./week-wrap-sections";
import { WEEK_WRAP_DRAMA_PLACEHOLDER, weekWrapIntro, weekWrapSubject } from "./week-wrap-tone";
import type { TouchdownClip } from "./week-wrap-touchdown";
import {
  emailTextWithTouchdown,
  touchdownEmailHtml,
} from "./week-wrap-touchdown-html";
import type { WeekWrapBlocks, WeekWrapFacts, WeekWrapTone } from "./week-wrap-types";

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
  const base = toGsm7(body).trim();
  const link = clip ? toGsm7(clip.shortUrl).trim() : "";
  const withClip =
    link && `${base}\n${link}`.length <= TRIAL_SMS_MAX ? `${base}\n${link}` : base;
  return withGameSmsFooter(withClip);
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
