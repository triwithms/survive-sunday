import { weekWrapAutoIntro } from "./week-wrap-auto";
import type { WeekWrapFacts, WeekWrapTone } from "./week-wrap-types";

/**
 * Email voice per tone. Every tone is automatic from WeekWrapFacts (no model,
 * no API call), so it always works at cron and Admin send.
 * Funny uses the Straight facts copy until a real banter paste lands here;
 * custom banter today = the Admin email intro override (intro only).
 * SMS stays the short facts block; these lines are the email voice.
 */

export function weekWrapSubject(tone: WeekWrapTone, facts: WeekWrapFacts): string {
  if (tone === "short") return `Wk ${facts.weekNumber} wrap`;
  return `Week ${facts.weekNumber} wrap`;
}

export function weekWrapIntro(_tone: WeekWrapTone, facts: WeekWrapFacts): string {
  return weekWrapAutoIntro(facts);
}

/** Funny-only one-liner. Empty until the banter paste lands, so nothing is invented. */
export const WEEK_WRAP_FUNNY_DRAMA = "";
