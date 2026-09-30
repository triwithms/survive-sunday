import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { isWeekLocked } from "@/lib/grading";
import { resolvedPoolWeek } from "@/lib/pool-current-week-db";
import { deferWeekLockedEffects } from "@/lib/week-lock-effects";
import { gameForPick, playerCanChangeCurrentPick } from "@/lib/pick-change";
import { isPoolParticipant } from "@/lib/pool-rules";
import { isPlayerPickWeek, resolvePlayerPickWeekFromLoaded } from "@/lib/next-week-picks";
import {
  picksOpenAtForStart,
  poolStartBanner,
  quietLeaderboardPage,
  weekCountsForPool,
} from "@/lib/pool-start-week";
import { assembleBoardPage } from "./assemble-board";
import { sortBoard } from "./sort-board";
import { winMarginByMember } from "./win-margin";
import type { BoardScreenProps } from "./types";
import { overlayPoolWeeks, withSlateGames } from "@/lib/slate-games";

export async function loadBoardPage(): Promise<BoardScreenProps> {
  const me = await requireMembership();
  const slate = await overlayPoolWeeks(
    me.poolId,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      select: {
        number: true,
        games: { select: { status: true, kickoff: true } },
      },
    })
  );
  const { currentWeek } = resolvedPoolWeek(
    me.pool.mode,
    me.pool.currentWeek,
    slate
  );
  const weekRef = await prisma.week.findFirst({
    where: { poolId: me.poolId, number: currentWeek },
    select: { id: true },
  });
  if (weekRef && weekCountsForPool(me.pool.startWeek, currentWeek)) {
    deferWeekLockedEffects(weekRef.id);
  }
  const loadedWeek = weekRef
    ? await prisma.week.findUnique({
        where: { id: weekRef.id },
        include: { picks: { include: { game: true } }, games: true },
      })
    : null;
  const week = loadedWeek ? await withSlateGames(loadedWeek) : null;
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
  const page = assembleBoardPage({
    me, currentWeek, week, sorted, participants, pickByMember,
    locked, canChangePick,
  });
  const decision = resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: slate.map((row) => ({
      number: row.number,
      locked: false,
      games: row.games.map((game) => ({
        id: "slate",
        awayAbbr: "",
        homeAbbr: "",
        kickoff: game.kickoff,
        status: game.status,
      })),
    })),
    currentPick: null,
    playingFromWeek: me.playingFromWeek,
  });
  const startNotice = poolStartBanner({
    startWeek: me.pool.startWeek,
    poolCurrentWeek: currentWeek,
    canPickStartWeek:
      me.pool.startWeek != null && isPlayerPickWeek(decision, me.pool.startWeek),
    picksOpenAt:
      me.pool.startWeek != null ? picksOpenAtForStart(me.pool.startWeek, slate) : null,
  });
  return quietLeaderboardPage(page, {
    startWeek: me.pool.startWeek,
    viewedWeek: currentWeek,
    banner: startNotice,
  });
}
