import { memberWeekPick } from "./enter-pick-options";
import type { EnterPickData } from "./enter-pick-types";
import { rosterMatches } from "./roster-row-meta";
import {
  compareNeedsYou,
  passesRosterFilter,
  type RosterFilterId,
  type RosterSortRow,
} from "./roster-needs-you";
import type { RosterMember } from "./roster-types";

export type RosterListRow = RosterSortRow & { member: RosterMember };

export function buildRosterRows(
  members: RosterMember[],
  enterPick: EnterPickData
): RosterListRow[] {
  return members.map((member) => ({
    id: member.id,
    nickname: member.nickname,
    status: member.status,
    hasWeekPick: Boolean(
      memberWeekPick(enterPick.members, member.id, enterPick.currentWeek)
    ),
    member,
  }));
}

export function visibleRosterRows(
  rows: RosterListRow[],
  query: string,
  filter: RosterFilterId,
  weekOpen: boolean
): RosterListRow[] {
  return rows
    .filter((row) => rosterMatches(row.member, query) && passesRosterFilter(row, filter))
    .sort((a, b) => compareNeedsYou(a, b, weekOpen));
}
