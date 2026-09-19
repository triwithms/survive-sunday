/** Plain-text GAME SMS tip. No HTML / no smaller font. */

export const GAME_SMS_FOOTER =
  "If you also get email, check spam/junk and mark Not junk.";

export function withGameSmsFooter(body: string): string {
  const text = (body ?? "").trim();
  if (!text) return GAME_SMS_FOOTER;
  if (text.includes("check spam/junk")) return text;
  return `${text}\n${GAME_SMS_FOOTER}`;
}
