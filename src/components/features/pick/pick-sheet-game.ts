import type { ScoreGameCardGame } from "@/components/features/scores/types";
import type { PickMatchup } from "./types";

/** Map a pick-week matchup onto the Scores Details sheet payload. */
export function pickSheetGame(
  matchup: PickMatchup | null | undefined
): ScoreGameCardGame | null {
  if (!matchup) return null;
  const id = matchup.id?.trim();
  const awayAbbr = matchup.away?.abbr?.trim();
  const homeAbbr = matchup.home?.abbr?.trim();
  if (!id || !awayAbbr || !homeAbbr) return null;
  return {
    id,
    awayAbbr,
    homeAbbr,
    scoreAway: matchup.scoreAway,
    scoreHome: matchup.scoreHome,
    status: matchup.status,
    note: matchup.note,
    kickoff: matchup.kickoff,
    network: null,
    awayLogoUrl: matchup.away.logoUrl,
    homeLogoUrl: matchup.home.logoUrl,
  };
}

export function pickDetailsAria(matchup: PickMatchup, sideName: string) {
  return `Details for ${sideName}, ${matchup.away.abbr} at ${matchup.home.abbr}`;
}
