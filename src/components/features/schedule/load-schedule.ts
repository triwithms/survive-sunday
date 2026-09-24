import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  pageWeekNumberForGame,
  playerPickDecision,
  selectPageWeek,
  weekNavOptions,
} from "@/lib/page-week";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { matchupGameParam } from "@/lib/matchup-share";
import { formatKickoff } from "@/lib/utils";
import { mapScheduleGames } from "./schedule-games";
import type { ScheduleScreenProps } from "./types";

export async function loadSchedulePage(searchParams?: {
  week?: string | string[];
  game?: string | string[];
}): Promise<ScheduleScreenProps | null> {
  const me = await requireMembership();
  const openGameId = matchupGameParam(searchParams?.game);
  const [{ currentWeek, weeks }, linkedWeek] = await Promise.all([
    loadParticipantWeeks(me),
    pageWeekNumberForGame(me.poolId, openGameId),
  ]);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const selectedRef = selectPageWeek({
    weeks,
    requested: searchParams?.week ?? linkedWeek?.toString(),
    basePath: "/schedule",
    currentWeek, actionWeek: decision.actionWeek,
    allowFuture: true, fallbackFirst: true,
  });
  if (!selectedRef) return null;

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  await syncWeekEspnForPage(selectedRef.id, week).catch((e) => {
    console.error("schedule espn score sync skipped", e);
    return null;
  });
  const teamAbbrs = [
    ...new Set(week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr])),
  ];
  const logoByAbbr = new Map(
    (teamAbbrs.length
      ? await prisma.team.findMany({
          where: { abbr: { in: teamAbbrs } },
          select: { abbr: true, logoUrl: true },
        })
      : []).map((t) => [t.abbr, t.logoUrl])
  );
  return {
    weekLabel: week.label,
    weekOptions: weekNavOptions(weeks),
    selectedWeek: week.number,
    focusWeek: decision.actionWeek,
    poll: shouldPollLiveScores(week.games),
    lockLabel: formatKickoff(effectiveLockAt(week)),
    locked: isWeekLocked(week),
    games: mapScheduleGames(week.games, logoByAbbr),
    openGameId,
  };
}
