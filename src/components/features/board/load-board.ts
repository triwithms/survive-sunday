import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { ensureWeekLockedEffects, isWeekLocked, MISSED_TEAM } from "@/lib/grading";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { gameForPick, playerCanChangeCurrentPick } from "@/lib/pick-change";
import { isPoolParticipant } from "@/lib/pool-rules";
import { assembleBoardPage } from "./assemble-board";
import { sortBoard } from "./sort-board";
import { winMarginByMember } from "./win-margin";
import type { BoardScreenProps } from "./types";

export async function loadBoardPage(): Promise<BoardScreenProps> {
  const me = await requireMembership();
  const currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const weekRef = await prisma.week.findFirst({
    where: { poolId: me.poolId, number: currentWeek },
    select: { id: true },
  });
  if (weekRef) {
    try { await ensureWeekLockedEffects(weekRef.id); }
    catch (e) { console.error("standings lock effects skipped", e); }
  }
  const week = weekRef
    ? await prisma.week.findUnique({
        where: { id: weekRef.id },
        include: { picks: { include: { game: true } }, games: true },
      })
    : null;
  const [members, seasonPicks] = await Promise.all([
    prisma.membership.findMany({ where: { poolId: me.poolId } }),
    prisma.pick.findMany({
      where: { membership: { poolId: me.poolId } },
      select: {
        membershipId: true,
        teamAbbr: true,
        result: true,
        game: {
          select: {
            awayAbbr: true,
            homeAbbr: true,
            scoreAway: true,
            scoreHome: true,
            status: true,
          },
        },
      },
    }),
  ]);
  const margins = winMarginByMember(seasonPicks);
  const pickByMember = new Map((week?.picks ?? []).map((p) => [p.membershipId, p]));
  const participants = members.filter((m) => isPoolParticipant(m)).map((m) => ({
    ...m,
    winMargin: margins.get(m.id) ?? 0,
  }));
  const sorted = sortBoard(participants);
  const locked = week ? isWeekLocked(week) : true;
  const playing = isPoolParticipant(me);
  const myBoardPick = week ? pickByMember.get(me.id) : undefined;
  const canChangePick = week
    ? playerCanChangeCurrentPick({
        weekNumber: week.number, weekLocked: locked,
        eliminated: me.status === "eliminated", isPlayer: playing,
        existingPick: myBoardPick ?? null,
        existingGame: gameForPick(myBoardPick, week.games),
      })
    : false;
  const teamAbbrs = [...new Set((week?.picks ?? [])
    .filter((p) => p.source !== "missed" && p.teamAbbr !== MISSED_TEAM)
    .map((p) => p.teamAbbr))];
  const logoByAbbr = new Map(
    (teamAbbrs.length
      ? await prisma.team.findMany({ where: { abbr: { in: teamAbbrs } }, select: { abbr: true, logoUrl: true } })
      : []).map((t) => [t.abbr, t.logoUrl])
  );
  return assembleBoardPage({
    me, currentWeek, week, sorted, participants, pickByMember, logoByAbbr,
    locked, canChangePick,
  });
}
