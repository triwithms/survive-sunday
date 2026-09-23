import { sortBoard } from "../components/features/board/sort-board";
import { winMarginByMember } from "../components/features/board/win-margin";
import { prisma } from "./db";
import { syncTeamStandingsFromEspn } from "./espn-standings";
import { isPoolParticipant } from "./pool-rules";
import { wrapNflDivisions } from "./week-wrap-nfl";
import type { WeekWrapBoardRow, WeekWrapNflDivision } from "./week-wrap-rich-types";

/** Pool seats in the same order as the app Leaderboard. Empty on error. */
export async function loadWrapBoard(poolId: string): Promise<WeekWrapBoardRow[]> {
  try {
    const [members, seasonPicks] = await Promise.all([
      prisma.membership.findMany({
        where: { poolId },
        select: {
          id: true, nickname: true, status: true, role: true, isParticipant: true,
          losses: true, weeksSurvived: true, autoPickStamps: true,
        },
      }),
      prisma.pick.findMany({
        where: { membership: { poolId } },
        select: {
          membershipId: true, teamAbbr: true, result: true,
          game: {
            select: { awayAbbr: true, homeAbbr: true, scoreAway: true, scoreHome: true, status: true },
          },
        },
      }),
    ]);
    const margins = winMarginByMember(seasonPicks);
    const seats = members
      .filter((member) => isPoolParticipant(member))
      .map((member) => ({ ...member, winMargin: margins.get(member.id) ?? 0 }));
    return sortBoard(seats).map(({ id, nickname, status, losses, weeksSurvived }) => ({
      id, nickname, status, losses, weeksSurvived,
    }));
  } catch (error) {
    console.warn("[week-wrap] pool board skipped", error);
    return [];
  }
}

/**
 * NFL divisions from the Team table. With `sync`, refresh from ESPN first and
 * return null if that fetch fails, so a send never shows stale W-L.
 */
export async function loadWrapNfl(opts: { sync: boolean }): Promise<WeekWrapNflDivision[] | null> {
  try {
    if (opts.sync) await syncTeamStandingsFromEspn();
    const teams = await prisma.team.findMany({
      select: {
        abbr: true, conference: true, division: true, divisionRank: true,
        wins: true, losses: true, ties: true,
      },
    });
    return wrapNflDivisions(teams);
  } catch (error) {
    console.warn("[week-wrap] NFL standings skipped", error);
    return null;
  }
}
