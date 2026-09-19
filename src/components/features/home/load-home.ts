import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import {
  loadParticipantWeeks,
  playerPickDecision,
  selectPageWeek,
  weekNavOptions,
} from "@/lib/page-week";
import { boardPickFields, sortParticipants } from "@/lib/tiebreak";
import {
  effectiveLockAt,
  ensureWeekLockedEffects,
  isWeekLocked,
} from "@/lib/grading";
import { shouldPollLiveScores, syncWeekScoresFromEspn } from "@/lib/live-scores";
import { isPoolParticipant } from "@/lib/pool-rules";
import { buildHomeRows } from "./build-home-rows";
import type { HomeScreenProps } from "./types";

export async function loadHomePage(searchParams?: {
  week?: string | string[];
}): Promise<HomeScreenProps | null> {
  const me = await requireMembership();
  const { currentWeek, weeks } = await loadParticipantWeeks(me);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const selectedRef = selectPageWeek({
    weeks, requested: searchParams?.week, basePath: "/pool",
    currentWeek, actionWeek: decision.actionWeek,
    allowFuture: false, fallbackFirst: true,
  });
  if (!selectedRef) return null;

  await ensureWeekLockedEffects(selectedRef.id);
  try { await syncWeekScoresFromEspn(selectedRef.id); }
  catch (e) { console.error("pool espn score sync skipped", e); }

  const week = await prisma.week.findUniqueOrThrow({
    where: { id: selectedRef.id },
    include: { games: true },
  });
  const members = await prisma.membership.findMany({
    where: { poolId: me.poolId },
    include: { picks: { where: { weekId: week.id }, include: { game: true } } },
  });
  const self = members.find((m) => m.id === me.id) ?? me;
  const locked = isWeekLocked(week);
  const sorted = sortParticipants(
    members.filter((m) => isPoolParticipant(m)).map((m) => ({
      ...m, ...boardPickFields(m.picks[0], week.games),
    }))
  );
  return {
    weekLabel: week.label, lockAt: effectiveLockAt(week),
    revealAllPicks: locked || week.number < currentWeek,
    weekOptions: weekNavOptions(weeks), selectedWeek: week.number,
    focusWeek: decision.actionWeek, poll: shouldPollLiveScores(week.games),
    hero: null, empty: null,
    games: [...week.games].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    ),
    rows: buildHomeRows(sorted), selfId: self.id,
  };
}
