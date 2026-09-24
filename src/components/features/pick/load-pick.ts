import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  playerPickDecision,
  selectPageWeek,
} from "@/lib/page-week";
import {
  isWeekLocked,
  parseUsedTeams,
  MISSED_TEAM,
} from "@/lib/grading";
import { canEditExistingPick, gameForPick } from "@/lib/pick-change";
import { isPlayerPickWeek } from "@/lib/next-week-picks";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { deferWeekLockedEffects } from "@/lib/week-lock-effects";
import { isPoolParticipant } from "@/lib/pool-rules";
import { pickMatchupsFromGames, usedTeamAbbrs } from "./pick-payload";
import type { PickClientProps } from "./pick-copy";

export type PickPageData = PickClientProps & { poll: boolean };

export async function loadPickPage(searchParams?: {
  week?: string | string[];
}): Promise<PickPageData | null> {
  const me = await requireMembership();
  const { currentWeek, weeks } = await loadParticipantWeeks(me);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const weekRef = selectPageWeek({
    weeks, requested: searchParams?.week, basePath: "/pick",
    currentWeek, actionWeek: decision.actionWeek,
    allowFuture: true, fallbackFirst: false,
  });
  if (!weekRef) return null;

  deferWeekLockedEffects(weekRef.id, { applyBackup: false });
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: {
      games: { orderBy: { kickoff: "asc" } },
      picks: { where: { membershipId: me.id } },
    },
  });
  await syncWeekEspnForPage(weekRef.id, week).catch((e) => {
    console.error("pick espn score sync skipped", e);
    return null;
  });
  const myPick = week.picks[0] ?? null;
  const locked = isWeekLocked(week);
  const eliminated = me.status === "eliminated";
  const spectator = !isPoolParticipant(me);
  const currentAbbr =
    myPick && myPick.source !== "missed" && myPick.teamAbbr !== MISSED_TEAM
      ? myPick.teamAbbr : null;
  const canChange =
    !eliminated && !spectator && isPlayerPickWeek(decision, week.number) &&
    canEditExistingPick({
      weekNumber: week.number, weekLocked: locked,
      existingPick: myPick, existingGame: gameForPick(myPick, week.games),
    });
  const abbrs = [...new Set(week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr]))];
  const [teams, priorPicks] = await Promise.all([
    abbrs.length
      ? prisma.team.findMany({ where: { abbr: { in: abbrs } } })
      : Promise.resolve([]),
    prisma.pick.findMany({
      where: {
        membershipId: me.id,
        weekId: { not: week.id },
        source: { not: "missed" },
      },
      select: { teamAbbr: true },
    }),
  ]);
  return {
    weekNumber: week.number, decision, locked, canChange, eliminated, spectator,
    currentPick: currentAbbr,
    games: pickMatchupsFromGames(
      week.games,
      new Map(teams.map((t) => [t.abbr, t])),
      usedTeamAbbrs(
        priorPicks.map((pick) => pick.teamAbbr),
        parseUsedTeams(me.usedTeamsJson),
        currentAbbr
      )
    ),
    poll: shouldPollLiveScores(week.games),
  };
}
