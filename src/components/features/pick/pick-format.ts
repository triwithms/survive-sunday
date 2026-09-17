import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
} from "@/lib/matchup-meta";
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
