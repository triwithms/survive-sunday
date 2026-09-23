import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  playerPickDecision,
  selectPageWeek,
} from "@/lib/page-week";
import {
  ensureWeekLockedEffects,
  isWeekLocked,
  parseUsedTeams,
  MISSED_TEAM,
} from "@/lib/grading";
import { canEditExistingPick, gameForPick } from "@/lib/pick-change";
import { isPlayerPickWeek } from "@/lib/next-week-picks";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
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

  try { await ensureWeekLockedEffects(weekRef.id, { applyBackup: false }); }
  catch (e) { console.error("pick lock effects skipped", e); }
  await syncWeekEspnForPage(weekRef.id).catch((e) => {
    console.error("pick espn score sync skipped", e);
    return null;
  });

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekRef.id },
    include: {
      games: { orderBy: { kickoff: "asc" } },
      picks: { where: { membershipId: me.id } },
    },
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
  const priorAbbrs = me.picks
    .filter((p) => p.weekId !== week.id && p.source !== "missed")
    .map((p) => p.teamAbbr);
  const abbrs = [...new Set(week.games.flatMap((g) => [g.awayAbbr, g.homeAbbr]))];
  const teams = abbrs.length
    ? await prisma.team.findMany({ where: { abbr: { in: abbrs } } })
    : [];
  return {
    weekNumber: week.number, decision, locked, canChange, eliminated, spectator,
    currentPick: currentAbbr,
    games: pickMatchupsFromGames(
      week.games,
      new Map(teams.map((t) => [t.abbr, t])),
      usedTeamAbbrs(priorAbbrs, parseUsedTeams(me.usedTeamsJson), currentAbbr)
    ),
    poll: shouldPollLiveScores(week.games),
  };
}
