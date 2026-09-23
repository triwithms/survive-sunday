import type { NotifyContent } from "./notification-copy";
import {
  withGameEmailHtml,
  withGameEmailText,
  withGameSmsFooter,
} from "./notify-game-footer";
import { TRIAL_SMS_MAX, toGsm7 } from "./sms-gsm";
import { weekWrapEmailText } from "./week-wrap-email-text";
import { weekWrapBodyHtml, weekWrapEmailDocument } from "./week-wrap-html";
import type { WeekWrapEmailParts } from "./week-wrap-rich-types";
import { weekWrapShortText } from "./week-wrap-sections";
import { WEEK_WRAP_FUNNY_DRAMA, weekWrapIntro, weekWrapSubject } from "./week-wrap-tone";
import type { TouchdownClip } from "./week-wrap-touchdown";
import type { WeekWrapBlocks, WeekWrapFacts, WeekWrapTone } from "./week-wrap-types";

function smsWithPrefs(body: string, clip: TouchdownClip | null): string {
  const base = toGsm7(body).trim();
  const link = clip ? toGsm7(clip.shortUrl).trim() : "";
  const withClip =
    link && `${base}\n${link}`.length <= TRIAL_SMS_MAX ? `${base}\n${link}` : base;
  return withGameSmsFooter(withClip);
}

/**
 * Automatic copy from WeekWrapFacts. Email is rich HTML sections (logos,
 * pool board, NFL divisions); SMS stays the short facts block. An email
 * override replaces only the intro. No live model.
 */
export function weekWrapContent(opts: {
  tone: WeekWrapTone;
  blocks: WeekWrapBlocks;
  facts: WeekWrapFacts;
  emailOverride?: string;
  smsOverride?: string;
  touchdown?: TouchdownClip | null;
}): NotifyContent {
  const sms = (opts.smsOverride ?? "").trim();
  const clip = opts.touchdown ?? null;
  const subject = weekWrapSubject(opts.tone, opts.facts);
  const parts: WeekWrapEmailParts = {
    intro: (opts.emailOverride ?? "").trim() || weekWrapIntro(opts.tone, opts.facts),
    drama: opts.tone === "funny" && opts.blocks.drama ? WEEK_WRAP_FUNNY_DRAMA : "",
    blocks: opts.blocks,
    facts: opts.facts,
    clip,
  };
  const htmlBody = withGameEmailHtml(weekWrapBodyHtml(parts));
  return {
    subject,
    text: withGameEmailText(weekWrapEmailText(parts)),
    htmlBody,
    html: weekWrapEmailDocument(subject, htmlBody),
    smsBody: smsWithPrefs(sms || weekWrapShortText(opts.facts, opts.blocks), clip),
  };
}
