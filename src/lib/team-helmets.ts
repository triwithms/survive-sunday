/** Local committed helmet backups. App abbr (WAS), not ESPN (WSH). */

import { canonicalTeamAbbr } from "./team-abbr";

export const TEAM_HELMET_PLACEHOLDER = "/helmets/_placeholder.svg";

const LOCAL_HELMET_PATH = /^\/helmets\/[^/?#]+\.png$/i;

export type BrokenLogoSrcs = string | null | undefined | Iterable<string>;

/** True for a local helmet PNG path (any filename casing). */
export function isLocalHelmetPath(src: string): boolean {
  return LOCAL_HELMET_PATH.test(src.trim());
}

/**
 * Always `/helmets/{appAbbr}.png` in lowercase. Aliases (WSH, LA, JAC, team
 * names…) map through `TEAM_ABBR_ALIASES` in `team-abbr.ts`.
 */
export function localHelmetSrc(abbr: string): string {
  const stem = helmetFileStem(abbr);
  const key = canonicalTeamAbbr(stem) ?? stem;
  return `/helmets/${key.toLowerCase()}.png`;
}

/** Local PNG for a known team; null when no committed helmet can match. */
export function knownHelmetSrc(abbr: string | null | undefined): string | null {
  if (!abbr) return null;
  return canonicalTeamAbbr(helmetFileStem(abbr)) ? localHelmetSrc(abbr) : null;
}

/** Local helmet, then local placeholder. No CDN / stored URL. */
export function resolveTeamLogoSrc(
  abbr: string | null | undefined,
  _stored: string | null | undefined,
  broken: BrokenLogoSrcs
): string {
  const local = knownHelmetSrc(abbr);
  const failed = new Set(
    broken == null ? [] : typeof broken === "string" ? [broken] : broken
  );
  if (local && !failed.has(local)) return local;
  return TEAM_HELMET_PLACEHOLDER;
}

function helmetFileStem(abbr: string): string {
  const leaf = abbr.trim().split(/[/\\]/).pop() ?? "";
  return leaf.replace(/\.png$/i, "").trim();
}
