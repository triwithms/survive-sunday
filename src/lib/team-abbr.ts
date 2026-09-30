/**
 * The one NFL abbreviation map. App abbr (WAS, LAR, JAX, …) → local helmet
 * file stem under `public/helmets/`, plus every other spelling a feed has
 * used for the same club. Safe for client, server, and scripts.
 */

// Very short stems (`ne`, `ad`) can be blanked by client ad/content filters; prefer longer ones.
export const TEAM_HELMET_FILES = {
  ARI: "ari",
  ATL: "atl",
  BAL: "bal",
  BUF: "buf",
  CAR: "car",
  CHI: "chi",
  CIN: "cin",
  CLE: "cle",
  DAL: "dal",
  DEN: "den",
  DET: "det",
  GB: "gb",
  HOU: "hou",
  IND: "ind",
  JAX: "jax",
  KC: "kc",
  LAC: "lac",
  LAR: "lar",
  LV: "lv",
  MIA: "mia",
  MIN: "min",
  NE: "nwe",
  NO: "no",
  NYG: "nyg",
  NYJ: "nyj",
  PHI: "phi",
  PIT: "pit",
  SEA: "sea",
  SF: "sf",
  TB: "tb",
  TEN: "ten",
  WAS: "was",
} as const;

export type TeamAbbr = keyof typeof TEAM_HELMET_FILES;

/**
 * Non-app spellings → app abbr. ESPN site/core (WSH), odds `details` and older
 * ESPN/Yahoo feeds (LA, JAC, WFT), relocations still in archives (STL, SD,
 * OAK), and Pro Football Reference / nflverse / PFF codes (GNB, KAN, LVR, …).
 */
export const TEAM_ABBR_ALIASES: Readonly<Record<string, TeamAbbr>> = {
  ARZ: "ARI",
  BLT: "BAL",
  CLV: "CLE",
  HST: "HOU",
  GNB: "GB",
  JAC: "JAX",
  KAN: "KC",
  KCC: "KC",
  SD: "LAC",
  SDG: "LAC",
  LA: "LAR",
  STL: "LAR",
  LVR: "LV",
  OAK: "LV",
  NWE: "NE",
  NOR: "NO",
  SFO: "SF",
  TAM: "TB",
  WSH: "WAS",
  WFT: "WAS",
};

export function isTeamAbbr(value: string): value is TeamAbbr {
  return Object.prototype.hasOwnProperty.call(TEAM_HELMET_FILES, value);
}

/** Trim + uppercase + alias. Unknown input comes back trimmed and uppercased. */
export function canonicalTeamAbbr(raw: string | null | undefined): string {
  const key = (raw ?? "").trim().toUpperCase();
  return TEAM_ABBR_ALIASES[key] ?? key;
}
