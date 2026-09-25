import {
  canonicalSpreads,
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
} from "@/lib/matchup-meta";
import { formatSignedSpread } from "@/lib/odds";
import type { PickMatchup, PickSide } from "./types";

export function matchupFavourite(m: PickMatchup) {
  return resolveFavourite({
    homeAbbr: m.home.abbr,
    awayAbbr: m.away.abbr,
    spreadHome: m.spreadHome,
    spreadAway: m.spreadAway,
    mlHome: m.mlHome,
    mlAway: m.mlAway,
  });
}

/** This team's own line (`-3.5`, `+3.5`, `PK`). Does not name the opponent. */
export function pickedSpreadLine(m: PickMatchup, abbr: string): string | null {
  const fav = matchupFavourite(m);
  if (!fav) return null;
  if (fav.abbr == null) return "PK";
  const pair = canonicalSpreads(m.spreadHome, m.spreadAway);
  if (!pair) return null;
  const signed = abbr === m.home.abbr ? pair.spreadHome : pair.spreadAway;
  const line = formatSignedSpread(signed);
  return line || null;
}

export function sideMeta(side: PickSide) {
  return [
    formatPriorYearRank(side.priorYearRank),
    formatCurrentStanding(side.standing),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function selectedPick(games: PickMatchup[], abbr: string | null) {
  const matchup = abbr
    ? games.find((m) => m.away.abbr === abbr || m.home.abbr === abbr) ?? null
    : null;
  const side = matchup
    ? matchup.away.abbr === abbr
      ? matchup.away
      : matchup.home
    : null;
  const opp =
    side && matchup
      ? matchup.away.abbr === side.abbr
        ? matchup.home
        : matchup.away
      : null;
  return { matchup, side, opp };
}
