/** GAME notice tips. SMS is plain text only — no font sizes. */

export const GAME_SMS_FOOTER =
  "If you also get email, check spam/junk and mark Not junk.";

export const GAME_EMAIL_FOOTER =
  "If this is in spam or junk, mark Not junk so the next one reaches you.";

function alreadyHasTip(text: string): boolean {
  return /spam\/junk|spam or junk/i.test(text);
}

export function withGameSmsFooter(body: string): string {
  const text = (body ?? "").trim();
  if (!text) return GAME_SMS_FOOTER;
  if (alreadyHasTip(text)) return text;
  return `${text}\n${GAME_SMS_FOOTER}`;
}

export function withGameEmailText(body: string): string {
  const text = (body ?? "").trim();
  if (!text) return GAME_EMAIL_FOOTER;
  if (alreadyHasTip(text)) return text;
  return `${text}\n\n${GAME_EMAIL_FOOTER}`;
}

export function gameEmailFooterHtml(): string {
  return `<p style="color:#9aa5b5;font-size:12px;margin:16px 0 0;">${GAME_EMAIL_FOOTER}</p>`;
}

export function withGameEmailHtml(bodyHtml: string): string {
  const html = bodyHtml ?? "";
  if (alreadyHasTip(html)) return html;
  return `${html}${gameEmailFooterHtml()}`;
}

export function withGameEmailDocument(html: string): string {
  const doc = html ?? "";
  if (alreadyHasTip(doc)) return doc;
  if (/<\/body>/i.test(doc)) {
    return doc.replace(/<\/body>/i, `${gameEmailFooterHtml()}</body>`);
  }
  return `${doc}${gameEmailFooterHtml()}`;
}
