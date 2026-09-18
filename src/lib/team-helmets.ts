/** Local committed helmet backups. App abbr (WAS), not ESPN (WSH). */

export const TEAM_HELMET_PLACEHOLDER = "/helmets/_placeholder.svg";

export function localHelmetSrc(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  const key = u === "WSH" ? "WAS" : u;
  return `/helmets/${key.toLowerCase()}.png`;
}
