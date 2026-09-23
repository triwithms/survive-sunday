export type RosterFilterId = "all" | "no_pick" | "one_loss" | "out";

export type RosterSortRow = {
  id: string;
  nickname: string;
  status: string;
  hasWeekPick: boolean;
  /**
   * Alive and a channel is Failed or Not checked.
   * Leave unset when no channel-status field exists — that skips the tier.
   */
  channelNeedsYou?: boolean;
};

export function isRosterOut(status: string): boolean {
  return status === "eliminated";
}

/** 0 no pick (week open), 1 channel, 2 everyone else, 3 out. */
export function needsYouRank(row: RosterSortRow, weekOpen: boolean): number {
  if (isRosterOut(row.status)) return 3;
  if (weekOpen && !row.hasWeekPick) return 0;
  if (row.channelNeedsYou === true) return 1;
  return 2;
}

export function compareNeedsYou(
  a: RosterSortRow,
  b: RosterSortRow,
  weekOpen: boolean
): number {
  const rank = needsYouRank(a, weekOpen) - needsYouRank(b, weekOpen);
  if (rank !== 0) return rank;
  return a.nickname.localeCompare(b.nickname, "en-CA", { sensitivity: "base" });
}

export function passesRosterFilter(
  row: RosterSortRow,
  filter: RosterFilterId
): boolean {
  if (filter === "all") return true;
  if (filter === "out") return isRosterOut(row.status);
  if (filter === "one_loss") return row.status === "one_loss";
  return !isRosterOut(row.status) && !row.hasWeekPick;
}

export function rosterFilterCounts(
  rows: RosterSortRow[]
): Record<RosterFilterId, number> {
  return {
    all: rows.length,
    no_pick: rows.filter((row) => passesRosterFilter(row, "no_pick")).length,
    one_loss: rows.filter((row) => passesRosterFilter(row, "one_loss")).length,
    out: rows.filter((row) => passesRosterFilter(row, "out")).length,
  };
}

export function rosterEmptyCopy(
  filter: RosterFilterId,
  week: number,
  searching: boolean
): string {
  if (searching) return "No one matches that.";
  if (filter === "no_pick") return `Everyone has a pick for Week ${week}.`;
  if (filter === "out") return "No one is out yet.";
  if (filter === "one_loss") return "No one is on one loss.";
  return "No one on the roster.";
}
