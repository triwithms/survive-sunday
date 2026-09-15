import { sanitizeGameOdds } from "@/lib/odds";

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

export type FavouriteInfo = {
  abbr: string;
  spread: number;
  /** e.g. `KC favoured by 3.5` or `even` */
  line: string;
  /** e.g. `KC favoured by 3.5` or `Even (pick'em)` */
  label: string;
};

function formatMargin(spread: number): string {
  const abs = Math.abs(Math.round(spread * 10) / 10);
  return Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
}

function favouriteCopy(abbr: string, signedSpread: number): FavouriteInfo {
  const rounded = Math.round(signedSpread * 10) / 10;
  if (rounded === 0) {
    return {
      abbr: "",
      spread: 0,
      line: "even",
      label: "Even (pick'em)",
    };
  }
  const phrase = `${abbr} favoured by ${formatMargin(rounded)}`;
  return { abbr, spread: signedSpread, line: phrase, label: phrase };
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
  if (spreadHome != null && !Number.isNaN(Number(spreadHome)) && spreadHome < 0) {
    return favouriteCopy(homeAbbr, spreadHome);
  }
  if (spreadAway != null && !Number.isNaN(Number(spreadAway)) && spreadAway < 0) {
    return favouriteCopy(awayAbbr, spreadAway);
  }
  if (spreadHome != null && !Number.isNaN(Number(spreadHome))) {
    if (spreadHome === 0) return favouriteCopy("", 0);
    if (spreadHome > 0) {
      return favouriteCopy(awayAbbr, -spreadHome);
    }
  }
  if (spreadAway != null && !Number.isNaN(Number(spreadAway)) && spreadAway === 0) {
    return favouriteCopy("", 0);
  }
  return null;
}
