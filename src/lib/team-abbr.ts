import { NFL_TEAM_META } from "./nfl-team-meta";

/** App team abbreviations. Helmet files are `public/helmets/{lowercase}.png`. */
export const APP_TEAM_ABBRS = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
  "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
  "LAC", "LAR", "LV", "MIA", "MIN", "NE", "NO", "NYG",
  "NYJ", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS",
] as const;

export type AppTeamAbbr = (typeof APP_TEAM_ABBRS)[number];

/**
 * Non-app team codes seen in ESPN (WSH), NFL/GSIS and odds feeds (LA, JAC),
 * Pro-Football-Reference style codes, and relocated-team leftovers.
 * The single alias map for team codes: helmets, ESPN parsing, schedule, odds.
 */
export const TEAM_ABBR_ALIASES: Readonly<Record<string, AppTeamAbbr>> = {
  WSH: "WAS",
  WFT: "WAS",
  LA: "LAR",
  STL: "LAR",
  RAM: "LAR",
  JAC: "JAX",
  LVR: "LV",
  OAK: "LV",
  RAI: "LV",
  SD: "LAC",
  SDG: "LAC",
  ARZ: "ARI",
  CRD: "ARI",
  BLT: "BAL",
  RAV: "BAL",
  CLV: "CLE",
  HST: "HOU",
  HTX: "HOU",
  CLT: "IND",
  OTI: "TEN",
  GNB: "GB",
  KAN: "KC",
  NWE: "NE",
  NOR: "NO",
  SFO: "SF",
  TAM: "TB",
};

const APP_ABBR_SET: ReadonlySet<string> = new Set(APP_TEAM_ABBRS);

function nameKey(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "Los Angeles Rams" / "los-angeles-rams" / "LA Rams" / "Rams" → LAR. */
const NAME_TO_ABBR: ReadonlyMap<string, AppTeamAbbr> = new Map(
  Object.values(NFL_TEAM_META).flatMap((t) =>
    [t.name, t.nickname, ...t.aliases].map(
      (n) => [nameKey(n), t.abbr as AppTeamAbbr] as const
    )
  )
);

/** App abbr (uppercase) for any known code, alias, or team name; else null. */
export function canonicalTeamAbbr(
  raw: string | null | undefined
): AppTeamAbbr | null {
  const code = (raw ?? "").trim().toUpperCase();
  if (!code) return null;
  if (APP_ABBR_SET.has(code)) return code as AppTeamAbbr;
  return TEAM_ABBR_ALIASES[code] ?? NAME_TO_ABBR.get(nameKey(code)) ?? null;
}

/** Canonical app abbr when known, else the trimmed uppercase input. */
export function normalizeTeamAbbr(raw: string): string {
  return canonicalTeamAbbr(raw) ?? raw.trim().toUpperCase();
}
