import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { ensureWeekLockedEffects, isWeekLocked, MISSED_TEAM } from "@/lib/grading";
import { sortParticipants, boardPickFields } from "@/lib/tiebreak";
import { effectiveCurrentWeek } from "@/lib/pool-mode";
import { gameForPick, playerCanChangeCurrentPick } from "@/lib/pick-change";
import { resolvePlayerPickWeek } from "@/lib/next-week-picks";
import { isPoolParticipant } from "@/lib/pool-rules";
import { assembleBoardPage } from "./assemble-board";
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
  const members = await prisma.membership.findMany({ where: { poolId: me.poolId } });
  const pickByMember = new Map((week?.picks ?? []).map((p) => [p.membershipId, p]));
  const participants = members.filter((m) => isPoolParticipant(m)).map((m) => ({
    ...m, ...boardPickFields(pickByMember.get(m.id), week?.games ?? []),
  }));
  const sorted = sortParticipants(participants);
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
  const nextWeek = await prisma.week.findUnique({
    where: { poolId_number: { poolId: me.poolId, number: currentWeek + 1 } },
    include: {
      games: { select: { id: true, status: true, kickoff: true, awayAbbr: true, homeAbbr: true } },
    },
  });
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
    locked, playing, canChangePick,
    decision: resolvePlayerPickWeek({
      poolCurrentWeek: currentWeek, currentWeekLocked: locked,
      existingCurrentPick: myBoardPick ?? null,
      existingCurrentGame: gameForPick(myBoardPick, week?.games ?? []),
      playingFromWeek: me.playingFromWeek,
      nextWeekHasGames: (nextWeek?.games.length ?? 0) > 0,
      nextWeekLocked: nextWeek ? isWeekLocked(nextWeek) : false,
    }),
  });
}
