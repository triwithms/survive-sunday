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
  /** e.g. `KC -3.5` */
  line: string;
  /** e.g. `Favourite: KC -3.5` */
  label: string;
};

export function resolveFavourite(opts: {
  homeAbbr: string;
  awayAbbr: string;
  spreadHome: number | null;
  spreadAway: number | null;
}): FavouriteInfo | null {
  const { homeAbbr, awayAbbr, spreadHome, spreadAway } = opts;
  if (spreadHome != null && !Number.isNaN(Number(spreadHome)) && spreadHome < 0) {
    return {
      abbr: homeAbbr,
      spread: spreadHome,
      line: `${homeAbbr} ${spreadHome}`,
      label: `Favourite: ${homeAbbr} ${spreadHome}`,
    };
  }
  if (spreadAway != null && !Number.isNaN(Number(spreadAway)) && spreadAway < 0) {
    return {
      abbr: awayAbbr,
      spread: spreadAway,
      line: `${awayAbbr} ${spreadAway}`,
      label: `Favourite: ${awayAbbr} ${spreadAway}`,
    };
  }
  // Pick side closer to favourite via negative ML-style: smaller (more negative) home spread means home favoured
  if (spreadHome != null && !Number.isNaN(Number(spreadHome))) {
    if (spreadHome === 0) return null;
    if (spreadHome > 0) {
      // home is underdog; away favoured by -spreadHome
      const spread = -spreadHome;
      return {
        abbr: awayAbbr,
        spread,
        line: `${awayAbbr} ${spread}`,
        label: `Favourite: ${awayAbbr} ${spread}`,
      };
    }
  }
  return null;
}
