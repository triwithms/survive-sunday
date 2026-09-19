/**
 * Season “💩” stamps for the ~5-minute best-ranked leftover auto-pick.
 * User picks, missed picks, and administrator import / fix-pick
 * (including Week 1 imported seats) never increment this.
 */

import { RANKED_PICK_SOURCE } from "./pick-mirror";

export const AUTO_PICK_STAMP = "💩";
/** Repeat the icon up to this many; beyond that show 💩×N. */
export const AUTO_PICK_STAMP_REPEAT_MAX = 5;

export function autoPickStampCount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export function shouldStampAutoPick(source: string | null | undefined): boolean {
  return source === RANKED_PICK_SOURCE;
}

/** Official pool winner must have a clean season (no ranked auto-pick stamps). */
export function isOfficialWinnerEligible(
  stamps: number | null | undefined
): boolean {
  return autoPickStampCount(stamps) === 0;
}

/**
 * Owner asked for a 💩 beside the name every time. Repeat for a few
 * uses; 💩×N when the row would overflow.
 */
export function formatAutoPickStamps(
  stamps: number | null | undefined
): string {
  const n = autoPickStampCount(stamps);
  if (n <= 0) return "";
  if (n <= AUTO_PICK_STAMP_REPEAT_MAX) return AUTO_PICK_STAMP.repeat(n);
  return `${AUTO_PICK_STAMP}×${n}`;
}

export function autoPickStampsTitle(
  stamps: number | null | undefined
): string {
  const n = autoPickStampCount(stamps);
  if (n <= 0) return "";
  const times = n === 1 ? "once" : `${n} times`;
  return `Best-ranked auto-pick used ${times} this season. A clean record (no 💩) is required to win the pool officially.`;
}
