/** Local committed helmet backups. App abbr (WAS), not ESPN (WSH). */

export const TEAM_HELMET_PLACEHOLDER = "/helmets/_placeholder.svg";

const LOCAL_HELMET_PATH = /^\/helmets\/[^/?#]+\.png$/i;

export type BrokenLogoSrcs = string | null | undefined | Iterable<string>;

/** True for a local helmet PNG path (any filename casing). */
export function isLocalHelmetPath(src: string): boolean {
  return LOCAL_HELMET_PATH.test(src.trim());
}

/**
 * Always `/helmets/{appAbbr}.png` in lowercase.
 * WAS file, not WSH; never an uppercase filename.
 */
export function localHelmetSrc(abbr: string): string {
  return `/helmets/${helmetFileStem(abbr)}.png`;
}

/** Local helmet, then local placeholder. No CDN / stored URL. */
export function resolveTeamLogoSrc(
  abbr: string,
  _stored: string | null | undefined,
  broken: BrokenLogoSrcs
): string {
  const local = localHelmetSrc(abbr);
  const failed = new Set(
    broken == null ? [] : typeof broken === "string" ? [broken] : broken
  );
  if (!failed.has(local)) return local;
  return TEAM_HELMET_PLACEHOLDER;
}

function helmetFileStem(abbr: string): string {
  const leaf = abbr.trim().split(/[/\\]/).pop() ?? "";
  const stem = leaf.replace(/\.png$/i, "").trim();
  const key = stem.toUpperCase() === "WSH" ? "WAS" : stem.toUpperCase();
  return key.toLowerCase();
}
