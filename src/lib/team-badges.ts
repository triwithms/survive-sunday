/** Original geometric badges — team colors + abbr. Not NFL/ESPN artwork. */

export type TeamBadge = {
  abbr: string;
  primary: string;
  secondary: string;
  letter: string;
};

const ALIASES: Record<string, string> = {
  WSH: "WAS",
  WFT: "WAS",
  JAC: "JAX",
  LA: "LAR",
  STL: "LAR",
  SD: "LAC",
  OAK: "LV",
  LVR: "LV",
  GNB: "GB",
  KAN: "KC",
  NWE: "NE",
  NOR: "NO",
  SFO: "SF",
  TAM: "TB",
};

/** All 32 clubs. Primary fill from `data/teams.json` where present. */
export const TEAM_BADGES: Record<string, TeamBadge> = {
  ARI: { abbr: "ARI", primary: "#97233F", secondary: "#FFB612", letter: "#FFFFFF" },
  ATL: { abbr: "ATL", primary: "#A71930", secondary: "#000000", letter: "#FFFFFF" },
  BAL: { abbr: "BAL", primary: "#241773", secondary: "#9E7C0C", letter: "#FFFFFF" },
  BUF: { abbr: "BUF", primary: "#00338D", secondary: "#C60C30", letter: "#FFFFFF" },
  CAR: { abbr: "CAR", primary: "#0085CA", secondary: "#101820", letter: "#FFFFFF" },
  CHI: { abbr: "CHI", primary: "#0B162A", secondary: "#C83803", letter: "#FFFFFF" },
  CIN: { abbr: "CIN", primary: "#FB4F14", secondary: "#000000", letter: "#FFFFFF" },
  CLE: { abbr: "CLE", primary: "#311D00", secondary: "#FF3C00", letter: "#FFFFFF" },
  DAL: { abbr: "DAL", primary: "#003594", secondary: "#869397", letter: "#FFFFFF" },
  DEN: { abbr: "DEN", primary: "#FB4F14", secondary: "#002244", letter: "#FFFFFF" },
  DET: { abbr: "DET", primary: "#0076B6", secondary: "#B0B7BC", letter: "#FFFFFF" },
  GB: { abbr: "GB", primary: "#203731", secondary: "#FFB612", letter: "#FFFFFF" },
  HOU: { abbr: "HOU", primary: "#03202F", secondary: "#A71930", letter: "#FFFFFF" },
  IND: { abbr: "IND", primary: "#002C5F", secondary: "#A2AAAD", letter: "#FFFFFF" },
  JAX: { abbr: "JAX", primary: "#101820", secondary: "#D7A22A", letter: "#D7A22A" },
  KC: { abbr: "KC", primary: "#E31837", secondary: "#FFB81C", letter: "#FFFFFF" },
  LV: { abbr: "LV", primary: "#000000", secondary: "#A5ACAF", letter: "#A5ACAF" },
  LAC: { abbr: "LAC", primary: "#0080C6", secondary: "#FFC20E", letter: "#FFFFFF" },
  LAR: { abbr: "LAR", primary: "#003594", secondary: "#FFA300", letter: "#FFFFFF" },
  MIA: { abbr: "MIA", primary: "#008E97", secondary: "#FC4C02", letter: "#FFFFFF" },
  MIN: { abbr: "MIN", primary: "#4F2683", secondary: "#FFC62F", letter: "#FFFFFF" },
  NE: { abbr: "NE", primary: "#002244", secondary: "#C60C30", letter: "#FFFFFF" },
  NO: { abbr: "NO", primary: "#D3BC8D", secondary: "#101820", letter: "#101820" },
  NYG: { abbr: "NYG", primary: "#0B2265", secondary: "#A71930", letter: "#FFFFFF" },
  NYJ: { abbr: "NYJ", primary: "#125740", secondary: "#FFFFFF", letter: "#FFFFFF" },
  PHI: { abbr: "PHI", primary: "#004C54", secondary: "#A5ACAF", letter: "#FFFFFF" },
  PIT: { abbr: "PIT", primary: "#FFB612", secondary: "#101820", letter: "#101820" },
  SF: { abbr: "SF", primary: "#AA0000", secondary: "#B3995D", letter: "#FFFFFF" },
  SEA: { abbr: "SEA", primary: "#002244", secondary: "#69BE28", letter: "#FFFFFF" },
  TB: { abbr: "TB", primary: "#D50A0A", secondary: "#FF7900", letter: "#FFFFFF" },
  TEN: { abbr: "TEN", primary: "#0C2340", secondary: "#4B92DB", letter: "#FFFFFF" },
  WAS: { abbr: "WAS", primary: "#5A1414", secondary: "#FFB612", letter: "#FFFFFF" },
};

export function badgeAbbr(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  return ALIASES[u] ?? u;
}

export function teamBadge(abbr: string): TeamBadge {
  const key = badgeAbbr(abbr);
  return (
    TEAM_BADGES[key] ?? {
      abbr: key.slice(0, 3) || "—",
      primary: "#1b2430",
      secondary: "#e8c547",
      letter: "#e8c547",
    }
  );
}

export function teamBadgeSvg(abbr: string): string {
  const b = teamBadge(abbr);
  const fontSize = b.abbr.length > 2 ? 16 : 22;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="${b.primary}" stroke="${b.secondary}" stroke-width="4"/>
  <text x="32" y="34" text-anchor="middle" dominant-baseline="middle" fill="${b.letter}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${fontSize}" font-weight="700">${b.abbr}</text>
</svg>`;
}
