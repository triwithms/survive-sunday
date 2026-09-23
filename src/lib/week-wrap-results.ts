import { STATUS_LABELS } from "./constants";
import { isWrapLoss } from "./week-wrap-players";
import type { WeekWrapNflTeam } from "./week-wrap-rich-types";
import { sortByTeam } from "./week-wrap-team-order";
import type { WeekWrapBlocks, WeekWrapPlayer } from "./week-wrap-types";

export type WrapResultGroups = {
  won: WeekWrapPlayer[];
  lost: WeekWrapPlayer[];
  out: WeekWrapPlayer[];
  /** Still-in seats with no graded result for this week yet. */
  pending: WeekWrapPlayer[];
};

/** A real team pick (not blank, not the MISS placeholder). */
export function hasTeamPick(player: WeekWrapPlayer): boolean {
  const abbr = (player.teamAbbr ?? "").trim().toUpperCase();
  return abbr !== "" && abbr !== "MISS";
}

/** Out before this week: never in Won / Lost / pending (no ghost picks). */
function outEarlier(player: WeekWrapPlayer): boolean {
  return player.status === "eliminated" && !player.eliminatedThisWeek;
}

/** Each list is grouped by team (`sortByTeam`), nicknames A–Z within a team. */
export function wrapResultGroups(players: WeekWrapPlayer[]): WrapResultGroups {
  const active = players.filter((player) => !outEarlier(player));
  const won = active.filter(
    (player) => hasTeamPick(player) && (player.result ?? "").toLowerCase() === "win"
  );
  const lost = active.filter((player) => isWrapLoss(player.teamAbbr, player.result));
  const done = new Set([...won, ...lost]);
  return {
    won: sortByTeam(won),
    lost: sortByTeam(lost),
    out: sortByTeam(players.filter((player) => player.eliminatedThisWeek)),
    pending: sortByTeam(active.filter((player) => !done.has(player))),
  };
}

export function showWrapResults(blocks: WeekWrapBlocks): boolean {
  return blocks.roster || blocks.picks;
}

/** Lost this week but the seat is still alive (mulligan). */
export function lostStillIn(player: WeekWrapPlayer): boolean {
  return player.status !== "eliminated";
}

export function wrapStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function nflRecord(team: WeekWrapNflTeam): string {
  const base = `${team.wins}-${team.losses}`;
  return team.ties > 0 ? `${base}-${team.ties}` : base;
}
