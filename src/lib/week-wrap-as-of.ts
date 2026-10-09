import { sortBoard } from "../components/features/board/sort-board";
import type { WrapHistoryPick, WrapRules, WrapSeat } from "./week-wrap-history";
import { isPoolParticipant } from "./pool-rules";
import type { WeekWrapBoardRow } from "./week-wrap-rich-types";
import { replaySeat } from "./week-wrap-replay";
import type { WeekWrapPlayer } from "./week-wrap-types";
import { weekWrapPlayers } from "./week-wrap-players";

/**
 * Won / lost / still-in / leaderboard as of the end of `weekNumber`.
 * A later elimination does not rewrite an earlier week.
 */
export function wrapWeekFromHistory(
  members: WrapSeat[],
  picks: WrapHistoryPick[],
  weekNumber: number,
  rules: WrapRules = {}
): { players: WeekWrapPlayer[]; board: WeekWrapBoardRow[] } {
  const projected = members
    .filter((seat) => isPoolParticipant(seat))
    .map((seat) => ({ seat, replay: replaySeat(seat, picks, weekNumber, rules) }));
  const players = weekWrapPlayers(
    projected.map(({ seat, replay }) => ({
      id: seat.id,
      nickname: seat.nickname,
      status: replay.status,
      role: seat.role,
      isParticipant: true,
      outBeforeWeek:
        replay.eliminatedWeek != null && replay.eliminatedWeek < weekNumber,
    })),
    projected.flatMap(({ replay }) =>
      replay.shown
        .filter((pick) => pick.weekNumber === weekNumber)
        .map((pick) => ({
          membershipId: pick.membershipId,
          teamAbbr: pick.teamAbbr,
          result: pick.result,
        }))
    )
  );
  const board = sortBoard(
    projected.map(({ seat, replay }) => ({
      id: seat.id,
      nickname: seat.nickname,
      status: replay.status,
      losses: replay.losses,
      weeksSurvived: replay.weeksSurvived,
      autoPickStamps: seat.autoPickStamps,
      winMargin: replay.shown.reduce((sum, pick) => sum + (pick.margin ?? 0), 0),
    }))
  ).map(({ id, nickname, status, losses, weeksSurvived }) => ({
    id,
    nickname,
    status,
    losses,
    weeksSurvived,
  }));
  return { players, board };
}
