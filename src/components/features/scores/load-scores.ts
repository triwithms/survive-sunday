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
import { isWeekLocked } from "@/lib/grading";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { deferWeekLockedEffects } from "@/lib/week-lock-effects";
import { boardPickFields, sortParticipants } from "@/lib/tiebreak";
import { isPoolParticipant } from "@/lib/pool-rules";
import { matchupGameParam } from "@/lib/matchup-share";
import { scoreCardGames, scoresPickRows, sortScoreGames } from "./score-view";
import type { ScoresScreenProps } from "./screen-types";

export async function loadScoresPage(searchParams?: {
  week?: string | string[];
  game?: string | string[];
}): Promise<ScoresScreenProps | null> {
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
    basePath: "/scores",
    currentWeek, actionWeek: decision.actionWeek,
    allowFuture: false, fallbackFirst: true,
  });
  if (!selectedRef) return null;

  deferWeekLockedEffects(selectedRef.id);
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: { orderBy: { kickoff: "asc" } } },
  });
  let espnSyncError: string | null = null;
  try { await syncWeekEspnForPage(selectedRef.id, week); }
  catch (e) {
    console.error("espn score sync skipped", e);
    espnSyncError = "Couldn’t refresh ESPN right now — showing last saved scores.";
  }
  const teamAbbrs = [...new Set(week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr]))];
  const logoByAbbr = new Map(
    (teamAbbrs.length
      ? await prisma.team.findMany({
          where: { abbr: { in: teamAbbrs } },
          select: { abbr: true, logoUrl: true },
        })
      : []).map((t) => [t.abbr, t.logoUrl])
  );
  const locked = isWeekLocked(week);
  const revealAllPicks = locked || week.number < currentWeek;
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: { picks: { where: { weekId: week.id } } },
  });
  const participants = sortParticipants(
    members.filter((member) => isPoolParticipant(member)).map((member) => ({
      ...member, ...boardPickFields(member.picks[0], week.games),
    }))
  );
  const games = sortScoreGames(week.games);
  const liveCount = games.filter((g) => g.status === "live").length;
  return {
    heading: {
      weekLabel: week.label, weekNumber: week.number, gameCount: games.length,
      liveCount, pickRowCount: participants.length, espnSyncError,
    },
    weekOptions: weekNavOptions(weeks),
    selectedWeek: week.number,
    focusWeek: decision.actionWeek,
    poll: shouldPollLiveScores(games),
    games: scoreCardGames(games, logoByAbbr),
    openGameId,
    revealAllPicks,
    rows: scoresPickRows(participants, me.id, revealAllPicks, logoByAbbr),
  };
}
