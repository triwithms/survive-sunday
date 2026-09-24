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

/**
 * One mirrored pair for every player screen.
 * The negative number is the favourite. If home and away disagree
 * (4.5 vs 5.5), mirror that favourite instead of letting one column win.
 */
export function canonicalSpreads(
  spreadHome: number | null | undefined,
  spreadAway: number | null | undefined
): { spreadHome: number; spreadAway: number } | null {
  const home =
    spreadHome != null && Number.isFinite(Number(spreadHome))
      ? Number(spreadHome)
      : null;
  const away =
    spreadAway != null && Number.isFinite(Number(spreadAway))
      ? Number(spreadAway)
      : null;
  if (home == null && away == null) return null;
  if (home != null && home < 0) return { spreadHome: home, spreadAway: -home };
  if (away != null && away < 0) return { spreadHome: -away, spreadAway: away };
  if (home === 0 || away === 0) return { spreadHome: 0, spreadAway: 0 };
  if (home != null) return { spreadHome: home, spreadAway: -home };
  return { spreadHome: -(away as number), spreadAway: away as number };
}

/** Plain-language line shared by My pick, Schedule, Selections, and team hub. */
export function playerSpreadLabel(game: {
  homeAbbr: string;
  awayAbbr: string;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome?: number | null;
  mlAway?: number | null;
}): string | null {
  return resolveFavourite(game)?.label ?? null;
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
  const pair = canonicalSpreads(odds.spreadHome, odds.spreadAway);
  if (!pair) return null;
  const spreadHome = pair.spreadHome;
  const spreadAway = pair.spreadAway;
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
