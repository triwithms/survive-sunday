import {
  formatSignedSpread,
  formatSpreadPoints,
  sanitizeGameOdds,
} from "@/lib/odds";

/** Shared helpers for prior-year rank, standings, and favourite display (en-CA). */

export type StandingBits = {
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number | null;
  conference: string;
  division: string;
};

/**
 * 2025 composite power rank (1 = strongest, 32 = weakest).
 * Demo/seed ranking for research — not official NFL standings.
 */
export function formatPriorYearRank(rank: number | null | undefined): string | null {
  if (rank == null || rank < 1) return null;
  return `2025 rank #${rank}`;
}

/** Short chip for tight UI (tables). */
export function formatPriorYearRankShort(
  rank: number | null | undefined
): string | null {
  if (rank == null || rank < 1) return null;
  return `#${rank}`;
}

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function formatRecord(s: StandingBits): string {
  if (s.ties > 0) return `${s.wins}-${s.losses}-${s.ties}`;
  return `${s.wins}-${s.losses}`;
}

export function formatDivisionPlace(s: StandingBits): string | null {
  if (s.divisionRank == null || s.divisionRank < 1) return null;
  const div = `${s.conference} ${s.division}`.trim();
  return `${ordinal(s.divisionRank)} ${div}`;
}

/** e.g. `1-0 · 1st AFC East` */
export function formatCurrentStanding(s: StandingBits | null | undefined): string | null {
  if (!s) return null;
  const rec = formatRecord(s);
  const place = formatDivisionPlace(s);
  return place ? `${rec} · ${place}` : rec;
}

export const PICKEM_LABEL = "Even (pick'em)";

export type FavouriteInfo = {
  /** Favoured team, or null when ESPN lists a pick'em. */
  abbr: string | null;
  spread: number;
  /** Compact line e.g. `KC -3.5` or `PK`. */
  line: string;
  /** Plain-language copy e.g. `KC favoured by 3.5` or `Even (pick'em)`. */
  label: string;
};

function pickemInfo(): FavouriteInfo {
  return { abbr: null, spread: 0, line: "PK", label: PICKEM_LABEL };
}

function favouredInfo(abbr: string, spread: number): FavouriteInfo {
  if (spread === 0) return pickemInfo();
  const signed = spread < 0 ? spread : -Math.abs(spread);
  return {
    abbr,
    spread: signed,
    line: `${abbr} ${formatSignedSpread(signed)}`,
    label: `${abbr} favoured by ${formatSpreadPoints(signed)}`,
  };
}

export function resolveFavourite(opts: {
  homeAbbr: string;
  awayAbbr: string;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome?: number | null;
  mlAway?: number | null;
}): FavouriteInfo | null {
  const { homeAbbr, awayAbbr } = opts;
  const odds = sanitizeGameOdds(opts);
  const spreadHome = odds.spreadHome;
  const spreadAway = odds.spreadAway;
  if (spreadHome != null && !Number.isNaN(Number(spreadHome))) {
    if (spreadHome === 0) return pickemInfo();
    if (spreadHome < 0) return favouredInfo(homeAbbr, spreadHome);
    return favouredInfo(awayAbbr, -spreadHome);
  }
  if (spreadAway != null && !Number.isNaN(Number(spreadAway))) {
    if (spreadAway === 0) return pickemInfo();
    if (spreadAway < 0) return favouredInfo(awayAbbr, spreadAway);
    return favouredInfo(homeAbbr, -spreadAway);
  }
  return null;
}
