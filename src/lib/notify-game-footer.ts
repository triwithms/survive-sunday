/** GAME notice tips. SMS is plain GSM-7 — no font sizes. */

import { PUBLIC_APP_ORIGIN } from "./invite-link";
import { fitTrialSms, TRIAL_SMS_MAX, toGsm7 } from "./sms-gsm";

export const PREFS_URL = `${PUBLIC_APP_ORIGIN}/account/notifications`;

/** Short on purpose so a notice can keep this line inside one trial segment. */
export const GAME_SMS_FOOTER = `Prefs: ${PREFS_URL}`;

export const GAME_EMAIL_FOOTER =
  `If this is in spam or junk, mark Not junk so the next one reaches you.\nPreferences: ${PREFS_URL}`;

/** Spam tip or preferences link already present — do not add a second footer. */
export function hasGameNoticeTip(text: string): boolean {
  return /account\/notifications|spam\/junk|spam or junk/i.test(text);
}

export function withGameSmsFooter(body: string): string {
  const text = toGsm7(body ?? "").trim();
  if (!text) return fitTrialSms(GAME_SMS_FOOTER);
  if (hasGameNoticeTip(text)) return fitTrialSms(text);
  const combined = `${text}\n${GAME_SMS_FOOTER}`;
  if (combined.length <= TRIAL_SMS_MAX) return combined;
  return fitTrialSms(text);
}

export function withGameEmailText(body: string): string {
  const text = (body ?? "").trim();
  if (!text) return GAME_EMAIL_FOOTER;
  if (hasGameNoticeTip(text)) return text;
  return `${text}\n\n${GAME_EMAIL_FOOTER}`;
}

const FOOT_STYLE = "font-size:12px;line-height:16px;color:#9aa5b5;";

/** Quiet footnote for every game email. Smaller and greyer than the body. */
export function gameEmailFooterHtml(): string {
  const link =
    `<a href="${PREFS_URL}" style="${FOOT_STYLE}text-decoration:underline;">Preferences</a>`;
  return `<p style="margin:16px 0 0;${FOOT_STYLE}"><span style="${FOOT_STYLE}">If this is in spam or junk, mark Not junk so the next one reaches you. ${link}</span></p>`;
}

export function withGameEmailHtml(bodyHtml: string): string {
  const html = bodyHtml ?? "";
  if (hasGameNoticeTip(html)) return html;
  return `${html}${gameEmailFooterHtml()}`;
}

export function withGameEmailDocument(html: string): string {
  const doc = html ?? "";
  if (hasGameNoticeTip(doc)) return doc;
  if (/<\/body>/i.test(doc)) {
    return doc.replace(/<\/body>/i, `${gameEmailFooterHtml()}</body>`);
  }
  return `${doc}${gameEmailFooterHtml()}`;
}
