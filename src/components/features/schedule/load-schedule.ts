import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  playerPickDecision,
  selectPageWeek,
  weekNavOptions,
} from "@/lib/page-week";
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { matchupGameParam, weekQueryForGame } from "@/lib/matchup-share";
import { formatKickoff } from "@/lib/utils";
import { mapScheduleGames } from "./schedule-games";
import type { ScheduleScreenProps } from "./types";

export async function loadSchedulePage(searchParams?: {
  week?: string | string[];
  game?: string | string[];
}): Promise<ScheduleScreenProps | null> {
  const me = await requireMembership();
  const { currentWeek, weeks } = await loadParticipantWeeks(me);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const openGameId = matchupGameParam(searchParams?.game);
  const selectedRef = selectPageWeek({
    weeks,
    requested: searchParams?.week ?? weekQueryForGame(weeks, openGameId),
    basePath: "/schedule",
    currentWeek, actionWeek: decision.actionWeek,
    allowFuture: true, fallbackFirst: true,
  });
  if (!selectedRef) return null;

  await syncWeekEspnForPage(selectedRef.id).catch((e) => {
    console.error("schedule espn score sync skipped", e);
    return null;
  });

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
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
