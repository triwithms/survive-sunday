/** Informational NFL lines. Never invent a spread when odds are missing. */

export type GameOdds = {
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
};

/** Seed used this exact combo when a matchup was not in the odds file. */
export const PLACEHOLDER_ODDS: GameOdds = {
  spreadHome: -3,
  spreadAway: 3,
  mlHome: -150,
  mlAway: 130,
};

export type SeedOddsInput = {
  away?: string;
  home?: string;
  spreadHome?: number;
  spreadAway?: number;
  mlHome?: number;
  mlAway?: number;
  spread?: { home?: number; away?: number };
  moneyline?: { home?: number; away?: number };
};

function finiteOrNull(n: unknown): number | null {
  if (typeof n === "number") return Number.isFinite(n) ? n : null;
  if (typeof n === "string") {
    const v = Number(n.trim().replace(/^\+/, ""));
    return Number.isFinite(v) ? v : null;
  }
  if (n != null && typeof n === "object") {
    const coerced = Number(n);
    if (Number.isFinite(coerced)) return coerced;
  }
  return null;
}

function finiteIntOrNull(n: unknown): number | null {
  const v = finiteOrNull(n);
  return v == null ? null : Math.trunc(v);
}

function numEq(a: number | null | undefined, b: number): boolean {
  return a != null && Number.isFinite(Number(a)) && Number(a) === b;
}

export function emptyOdds(): GameOdds {
  return {
    spreadHome: null,
    spreadAway: null,
    mlHome: null,
    mlAway: null,
  };
}

export function isPlaceholderOdds(
  o: Partial<GameOdds> | null | undefined
): boolean {
  if (!o) return false;
  return (
    numEq(o.spreadHome, PLACEHOLDER_ODDS.spreadHome!) &&
    numEq(o.spreadAway, PLACEHOLDER_ODDS.spreadAway!) &&
    numEq(o.mlHome, PLACEHOLDER_ODDS.mlHome!) &&
    numEq(o.mlAway, PLACEHOLDER_ODDS.mlAway!)
  );
}

export function sanitizeGameOdds(
  o: Partial<GameOdds> | null | undefined
): GameOdds {
  if (!o || isPlaceholderOdds(o)) return emptyOdds();
  return {
    spreadHome: finiteOrNull(o.spreadHome),
    spreadAway: finiteOrNull(o.spreadAway),
    mlHome: finiteIntOrNull(o.mlHome),
    mlAway: finiteIntOrNull(o.mlAway),
  };
}

function firstFinite(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = finiteOrNull(v);
    if (n != null) return n;
  }
  return null;
}

/**
 * Map a seed/odds-file row onto Game fields.
 * Missing matchups → all null (never a fake home -3).
 */
export function resolveSeedOdds(o: SeedOddsInput | undefined): GameOdds {
  if (!o) return emptyOdds();
  const spreadHome = firstFinite(o.spreadHome, o.spread?.home);
  const spreadAway = firstFinite(
    o.spreadAway,
    o.spread?.away,
    spreadHome != null ? -spreadHome : null
  );
  const mlHome = firstFinite(o.mlHome, o.moneyline?.home);
  const mlAway = firstFinite(o.mlAway, o.moneyline?.away);
  return sanitizeGameOdds({ spreadHome, spreadAway, mlHome, mlAway });
}

export function lookupSeedOdds(
  list: SeedOddsInput[],
  away: string,
  home: string
): GameOdds {
  const hit = list.find((o) => o.away === away && o.home === home);
  return resolveSeedOdds(hit);
}

/** Parse ESPN american / line strings: `-3`, `+4.5`, `-170`. */
export function parseSignedNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (/^(PK|EVEN|PICK)$/i.test(t)) return 0;
  const n = Number(t.replace(/^\+/, ""));
  return Number.isFinite(n) ? n : null;
}

/** Absolute points, no sign — `4.5` / `3`. */
export function formatSpreadPoints(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(Math.round(n * 10) / 10);
  return Number.isInteger(abs) ? String(abs) : abs.toFixed(1);
}

/** `-3.5` / `+3` / `PK` for compact betting-line storage. */
export function formatSignedSpread(n: number): string {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10) / 10;
  if (rounded === 0) return "PK";
  return `${rounded < 0 ? "-" : "+"}${formatSpreadPoints(rounded)}`;
}

export function formatSpreadOrDash(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return formatSignedSpread(Number(n));
}

type PickcenterItem = {
  details?: string;
  spread?: number;
  homeTeamOdds?: { favorite?: boolean; moneyLine?: number };
  awayTeamOdds?: { favorite?: boolean; moneyLine?: number };
  pointSpread?: {
    home?: { close?: { line?: string }; open?: { line?: string } };
    away?: { close?: { line?: string }; open?: { line?: string } };
  };
  moneyline?: {
    home?: { close?: { odds?: string } };
    away?: { close?: { odds?: string } };
  };
};

/**
 * ESPN site summary `pickcenter` (or core odds `items`).
 * Uses closing home/away lines when present — never guesses -3.
 */
export function parseEspnPickcenter(items: unknown): GameOdds | null {
  const list = Array.isArray(items) ? items : [];
  const item = list[0] as PickcenterItem | undefined;
  if (!item || typeof item !== "object") return null;

  let spreadHome =
    parseSignedNumber(item.pointSpread?.home?.close?.line) ??
    parseSignedNumber(item.pointSpread?.home?.open?.line);
  let spreadAway =
    parseSignedNumber(item.pointSpread?.away?.close?.line) ??
    parseSignedNumber(item.pointSpread?.away?.open?.line);

  if (
    spreadHome == null &&
    spreadAway == null &&
    typeof item.spread === "number" &&
    Number.isFinite(item.spread)
  ) {
    const favSpread =
      item.spread === 0 ? 0 : item.spread < 0 ? item.spread : -Math.abs(item.spread);
    if (item.homeTeamOdds?.favorite && !item.awayTeamOdds?.favorite) {
      spreadHome = favSpread;
      spreadAway = -favSpread;
    } else if (item.awayTeamOdds?.favorite && !item.homeTeamOdds?.favorite) {
      spreadAway = favSpread;
      spreadHome = -favSpread;
    }
  }

  if (spreadHome == null && spreadAway != null) spreadHome = -spreadAway;
  if (spreadAway == null && spreadHome != null) spreadAway = -spreadHome;

  const mlHome =
    parseSignedNumber(item.homeTeamOdds?.moneyLine) ??
    parseSignedNumber(item.moneyline?.home?.close?.odds);
  const mlAway =
    parseSignedNumber(item.awayTeamOdds?.moneyLine) ??
    parseSignedNumber(item.moneyline?.away?.close?.odds);

  if (
    spreadHome == null &&
    spreadAway == null &&
    mlHome == null &&
    mlAway == null
  ) {
    return null;
  }

  const odds = sanitizeGameOdds({
    spreadHome,
    spreadAway,
    mlHome,
    mlAway,
  });
  if (
    odds.spreadHome == null &&
    odds.spreadAway == null &&
    odds.mlHome == null &&
    odds.mlAway == null
  ) {
    return null;
  }
  return odds;
}

export type EspnSummaryOddsPayload = {
  pickcenter?: unknown;
  odds?: unknown;
};

function firstDetails(items: unknown): string | null {
  const list = Array.isArray(items) ? items : [];
  const item = list[0] as { details?: unknown } | undefined;
  return typeof item?.details === "string" ? item.details : null;
}

/**
 * ESPN prints `details` ("GB -4.5") on the scoreboard. `pointSpread.close`
 * can be a different number (open vs current, or another book). Player
 * screens store and show the printed line so My pick and Schedule cannot
 * disagree by which field a payload happened to include.
 */
export function withEspnDetailsLine(
  odds: GameOdds | null,
  details: string | null | undefined,
  homeAbbr: string,
  awayAbbr: string
): GameOdds | null {
  const fromDetails = parseEspnOddsDetails(details, homeAbbr, awayAbbr);
  if (!fromDetails) return odds;
  return sanitizeGameOdds({
    spreadHome: fromDetails.spreadHome,
    spreadAway: fromDetails.spreadAway,
    mlHome: odds?.mlHome ?? null,
    mlAway: odds?.mlAway ?? null,
  });
}

export function parseEspnSummaryOdds(
  payload: EspnSummaryOddsPayload | null | undefined,
  homeAbbr?: string,
  awayAbbr?: string
): GameOdds | null {
  if (!payload) return null;
  const parsed =
    parseEspnPickcenter(payload.pickcenter) ?? parseEspnPickcenter(payload.odds);
  if (!homeAbbr || !awayAbbr) return parsed;
  const details = firstDetails(payload.pickcenter) ?? firstDetails(payload.odds);
  return withEspnDetailsLine(parsed, details, homeAbbr, awayAbbr);
}

function oddsAbbr(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  if (u === "WSH" || u === "WFT") return "WAS";
  if (u === "JAC") return "JAX";
  if (u === "LA") return "LAR";
  return u;
}

/**
 * ESPN `details` like `BUF -4.5` / `CAR -2.5` / `NE PK`.
 * Maps onto home/away spreads — never guesses a line.
 */
export function parseEspnOddsDetails(
  details: string | null | undefined,
  homeAbbr: string,
  awayAbbr: string
): { spreadHome: number; spreadAway: number } | null {
  if (!details) return null;
  const m = details.trim().match(/^([A-Za-z]{2,3})\s+(\S+)$/);
  if (!m) return null;
  const spread = parseSignedNumber(m[2]);
  if (spread == null) return null;
  const favAbbr = oddsAbbr(m[1]);
  const home = oddsAbbr(homeAbbr);
  const away = oddsAbbr(awayAbbr);
  if (favAbbr === home) return { spreadHome: spread, spreadAway: -spread };
  if (favAbbr === away) return { spreadAway: spread, spreadHome: -spread };
  return null;
}

export function hasUsableOdds(o: GameOdds | null | undefined): boolean {
  if (!o) return false;
  return (
    o.spreadHome != null ||
    o.spreadAway != null ||
    o.mlHome != null ||
    o.mlAway != null
  );
}

/**
 * Scoreboard `competitions[0].odds` (already on the week scoreboard).
 * Prefer this over a per-game summary fetch so Schedule/Pick can show
 * lines without 16 extra ESPN round-trips.
 */
export function parseEspnCompetitionOdds(
  oddsItems: unknown,
  homeAbbr: string,
  awayAbbr: string
): GameOdds | null {
  const parsed = parseEspnPickcenter(oddsItems);
  const lined = withEspnDetailsLine(
    parsed,
    firstDetails(oddsItems),
    homeAbbr,
    awayAbbr
  );
  if (
    !lined ||
    (lined.spreadHome == null &&
      lined.spreadAway == null &&
      lined.mlHome == null &&
      lined.mlAway == null)
  ) {
    return null;
  }
  return lined;
}
