/** Local committed helmet backups. File names come from `TEAM_HELMET_FILES`. */

import { canonicalTeamAbbr, isTeamAbbr, TEAM_HELMET_FILES } from "./team-abbr";

export const TEAM_HELMET_PLACEHOLDER = "/helmets/_placeholder.svg";

const LOCAL_HELMET_PATH = /^\/helmets\/[^/?#]+\.png$/i;
const SAFE_STEM = /^[a-z0-9]{1,5}$/;

export type BrokenLogoSrcs = string | null | undefined | Iterable<string>;

/** True for a local helmet PNG path (any filename casing). */
export function isLocalHelmetPath(src: string): boolean {
  return LOCAL_HELMET_PATH.test(src.trim());
}

/** `" la "`, `"/helmets/LA.png"`, `"LA.png"` → `"la"`. */
function rawStem(abbr: string): string {
  const leaf = abbr.trim().split(/[/\\]/).pop() ?? "";
  return leaf.replace(/\.png$/i, "").trim().toLowerCase();
}

/** Mapped helmet file stem, or null when the input is not an NFL club. */
export function helmetFileFor(abbr: string): string | null {
  const key = canonicalTeamAbbr(rawStem(abbr));
  return isTeamAbbr(key) ? TEAM_HELMET_FILES[key] : null;
}

/**
 * Local helmet srcs to try, best first: the mapped file (WSH → was.png,
 * LA → lar.png), then the input's own lowercase name if it differs.
 */
export function helmetSrcCandidates(abbr: string): string[] {
  const out: string[] = [];
  for (const stem of [helmetFileFor(abbr), rawStem(abbr)]) {
    if (!stem || !SAFE_STEM.test(stem)) continue;
    const src = `/helmets/${stem}.png`;
    if (!out.includes(src)) out.push(src);
  }
  return out;
}

/** Best local helmet path, always lowercase. Placeholder if nothing usable. */
export function localHelmetSrc(abbr: string): string {
  return helmetSrcCandidates(abbr)[0] ?? TEAM_HELMET_PLACEHOLDER;
}

/** First local candidate not yet broken, then local placeholder. No CDN / stored URL. */
export function resolveTeamLogoSrc(
  abbr: string,
  _stored: string | null | undefined,
  broken: BrokenLogoSrcs
): string {
  const failed = new Set(
    broken == null ? [] : typeof broken === "string" ? [broken] : broken
  );
  return (
    helmetSrcCandidates(abbr).find((src) => !failed.has(src)) ??
    TEAM_HELMET_PLACEHOLDER
  );
}
