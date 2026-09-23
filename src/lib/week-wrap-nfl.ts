import { DIVISION_ORDER, winPct } from "./standings-format";
import type { WeekWrapNflDivision, WeekWrapNflTeam } from "./week-wrap-rich-types";

export type WrapNflTeamInput = WeekWrapNflTeam & {
  conference: string;
  division: string;
  divisionRank: number | null;
};

function byRank(a: WrapNflTeamInput, b: WrapNflTeamInput): number {
  const rank = (a.divisionRank ?? 99) - (b.divisionRank ?? 99);
  if (rank) return rank;
  const pct = winPct(b.wins, b.losses, b.ties) - winPct(a.wins, a.losses, a.ties);
  if (pct) return pct;
  return a.abbr.localeCompare(b.abbr);
}

/**
 * AFC/NFC divisions in the Standings page order, best record first.
 * Null when no team has a game on record (never synced) so the email omits it.
 */
export function wrapNflDivisions(
  teams: WrapNflTeamInput[]
): WeekWrapNflDivision[] | null {
  if (!teams.some((team) => team.wins + team.losses + team.ties > 0)) return null;
  const divisions = DIVISION_ORDER.map(({ conference, division }) => ({
    conference,
    division,
    teams: teams
      .filter((team) => team.conference === conference && team.division === division)
      .sort(byRank)
      .map(({ abbr, wins, losses, ties }) => ({ abbr, wins, losses, ties })),
  })).filter((row) => row.teams.length > 0);
  return divisions.length ? divisions : null;
}
