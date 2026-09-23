/** One GSM-7 segment. Emoji and smart punctuation force UCS-2 and can 30044. */

export const TRIAL_SMS_MAX = 160;

const BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

const GSM = new Set(BASIC);

const FOLD: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201A": "'",
  "\u201C": '"',
  "\u201D": '"',
  "\u201E": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2212": "-",
  "\u2026": "...",
  "\u00A0": " ",
};

/** Plain GSM-7. Drops emoji and anything that would switch the text to UCS-2. */
export function toGsm7(input: string): string {
  let out = "";
  for (const raw of input ?? "") {
    const folded = FOLD[raw] ?? raw;
    for (const ch of folded) {
      if (ch === "\t") {
        out += " ";
        continue;
      }
      if (GSM.has(ch)) out += ch;
    }
  }
  return out;
}

export function gsm7Length(input: string): number {
  return toGsm7(input).length;
}

/** Keep one trial segment. Cuts on a space or newline, then adds "...". */
export function fitTrialSms(input: string): string {
  const text = toGsm7(input).trim();
  if (text.length <= TRIAL_SMS_MAX) return text;
  const room = TRIAL_SMS_MAX - 3;
  let cut = text.slice(0, room).trimEnd();
  const br = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(" "));
  if (br >= 40) cut = cut.slice(0, br).trimEnd();
  const next = `${cut}...`;
  return next.length <= TRIAL_SMS_MAX ? next : text.slice(0, TRIAL_SMS_MAX);
}
