import { localHelmetSrc, TEAM_HELMET_PLACEHOLDER } from "./team-helmets";

export { localHelmetSrc, TEAM_HELMET_PLACEHOLDER };

/** App abbr (WAS) → ESPN team id. Safe for parser tests (no server-only). */
export const ESPN_TEAM_IDS: Record<string, string> = {
  ARI: "22",
  ATL: "1",
  BAL: "33",
  BUF: "2",
  CAR: "29",
  CHI: "3",
  CIN: "4",
  CLE: "5",
  DAL: "6",
  DEN: "7",
  DET: "8",
  GB: "9",
  HOU: "34",
  IND: "11",
  JAX: "30",
  KC: "12",
  LV: "13",
  LAC: "24",
  LAR: "14",
  MIA: "15",
  MIN: "16",
  NE: "17",
  NO: "18",
  NYG: "19",
  NYJ: "20",
  PHI: "21",
  PIT: "23",
  SF: "25",
  SEA: "26",
  TB: "27",
  TEN: "10",
  WAS: "28",
};

const ESPN_ID_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_TEAM_IDS).map(([abbr, id]) => [id, abbr])
);

export function normAbbr(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  return u === "WSH" ? "WAS" : u;
}

/** App abbr (WAS) → ESPN site abbreviation (WSH). */
export function espnAbbr(abbr: string): string {
  const key = normAbbr(abbr);
  return key === "WAS" ? "WSH" : key;
}

export function abbrFromEspnTeamId(
  id: string | number | null | undefined
): string | null {
  if (id == null || id === "") return null;
  return ESPN_ID_TO_ABBR[String(id)] ?? null;
}

/** ESPN CDN mark (same path as `data/teams.json` / Team.logoUrl). */
export function espnTeamLogoUrl(abbr: string): string {
  return `https://a.espncdn.com/i/teamlogos/nfl/500/${espnAbbr(abbr).toLowerCase()}.png`;
}

/** Slug from an ESPN NFL mark URL, or null if it is not that CDN path. */
function espnNflLogoSlug(url: string): string | null {
  const m = url.match(
    /\/i\/teamlogos\/nfl\/500(?:-dark)?\/([^/?#]+)\.png(?:[?#]|$)/i
  );
  return m ? m[1].toLowerCase() : null;
}

/** Prefer stored Team.logoUrl; otherwise the ESPN CDN logo. Never invents art. */
export function teamLogoUrl(abbr: string, stored?: string | null): string {
  const espn = espnTeamLogoUrl(abbr);
  const trimmed = stored?.trim();
  if (!trimmed) return espn;
  const slug = espnNflLogoSlug(trimmed);
  // Wrong ESPN filename (numeric leftover, chicago.png, …) → canonical slug.
  if (slug != null && slug !== espnAbbr(abbr).toLowerCase()) return espn;
  return trimmed;
}

/** Local helmet, then stored/ESPN. Never null — placeholder last, never letters. */
export function resolveTeamLogoSrc(
  abbr: string,
  stored: string | null | undefined,
  broken: string | null
): string {
  const local = localHelmetSrc(abbr);
  const espn = espnTeamLogoUrl(abbr);
  const preferred = teamLogoUrl(abbr, stored);
  const candidates: string[] = [];
  for (const src of [local, preferred, espn, TEAM_HELMET_PLACEHOLDER]) {
    if (!candidates.includes(src)) candidates.push(src);
  }
  if (broken == null) return candidates[0]!;
  const i = candidates.indexOf(broken);
  if (i >= 0 && i < candidates.length - 1) return candidates[i + 1]!;
  return TEAM_HELMET_PLACEHOLDER;
}
