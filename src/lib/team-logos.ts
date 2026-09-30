/**
 * Per-pool "Team logos" switch. Null (pools from before the column) is on.
 * TEAM_LOGOS_DISABLED=true forces text badges for every pool. Resolve on the
 * server and pass the boolean down: the client bundle never sees this env.
 */

import { canonicalTeamAbbr } from "./team-abbr";

type Env = Record<string, string | undefined>;

export function teamLogosForcedOff(env: Env = process.env): boolean {
  return (env.TEAM_LOGOS_DISABLED ?? "").trim().toLowerCase() === "true";
}

export function showTeamLogosFor(
  poolSetting: boolean | null | undefined,
  env: Env = process.env
): boolean {
  if (teamLogosForcedOff(env)) return false;
  return poolSetting !== false;
}

export function teamLogosAuditSummary(on: boolean): string {
  return on ? "Team logos on" : "Team logos off (abbreviations)";
}

/** Badge text: app abbreviation (WSH → WAS), uppercase, at most 4 letters. */
export function teamMarkText(abbr: string): string {
  return canonicalTeamAbbr(abbr).slice(0, 4);
}

/** Font size that keeps three letters inside a square of `size` px. */
export function teamMarkFontPx(size: number): number {
  return Math.max(7, Math.round(size * 0.34));
}
