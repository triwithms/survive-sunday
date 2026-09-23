import type { WeekWrapTone } from "./week-wrap-types";

/**
 * Placeholder tone lines only.
 * Swap this file when the Funny / Straight / Short paste lands.
 * SMS stays the short facts block; these lines are the email voice.
 */

export function weekWrapSubject(tone: WeekWrapTone, weekNumber: number): string {
  if (tone === "short") return `Wk ${weekNumber} wrap`;
  if (tone === "funny") return `Week ${weekNumber} wrap (funny)`;
  return `Week ${weekNumber} wrap`;
}

export function weekWrapIntro(tone: WeekWrapTone, weekNumber: number): string {
  if (tone === "funny") return `Week ${weekNumber}. Funny placeholder.`;
  return `Week ${weekNumber} wrap.`;
}

export const WEEK_WRAP_DRAMA_PLACEHOLDER = "Drama placeholder.";
