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
import { effectiveLockAt, isWeekLocked } from "@/lib/grading";
import { shouldPollLiveScores } from "@/lib/live-scores";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { deferWeekLockedEffects } from "@/lib/week-lock-effects";
import { isPoolParticipant } from "@/lib/pool-rules";
import { isPlayerPickWeek } from "@/lib/next-week-picks";
import {
  picksOpenAtForStart,
  poolStartBanner,
  weeksFromPoolStart,
} from "@/lib/pool-start-week";
import { withSlateGames } from "@/lib/slate-games";
import { buildHomeRows } from "./build-home-rows";
import type { HomeScreenProps } from "./types";

export async function loadHomePage(searchParams?: {
  week?: string | string[];
}): Promise<HomeScreenProps | null> {
  const me = await requireMembership();
  const { currentWeek, weeks } = await loadParticipantWeeks(me);
  const decision = playerPickDecision(me, weeks, currentWeek);
  const visibleWeeks = weeksFromPoolStart(weeks, me.pool.startWeek);
  const startNotice = poolStartBanner({
    startWeek: me.pool.startWeek,
    poolCurrentWeek: currentWeek,
    canPickStartWeek:
      me.pool.startWeek != null && isPlayerPickWeek(decision, me.pool.startWeek),
    picksOpenAt:
      me.pool.startWeek != null
        ? picksOpenAtForStart(me.pool.startWeek, weeks)
        : null,
  });
  const selectedRef = selectPageWeek({
    weeks: visibleWeeks, requested: searchParams?.week, basePath: "/pool",
    currentWeek, actionWeek: currentWeek,
    allowFuture: false, fallbackFirst: true,
  });
  if (!selectedRef) return null;

  deferWeekLockedEffects(selectedRef.id);
  const [weekRow, members] = await Promise.all([
    prisma.week.findUniqueOrThrow({
      where: { id: selectedRef.id },
      include: { games: true },
    }),
    prisma.membership.findMany({
      where: { poolId: me.poolId },
      include: {
        picks: {
          where: { weekId: selectedRef.id },
          include: { game: true },
        },
      },
    }),
  ]);
  const week = await withSlateGames(weekRow);
  try { await syncWeekEspnForPage(selectedRef.id, week); }
  catch (e) { console.error("pool espn score sync skipped", e); }
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
    weekOptions: weekNavOptions(visibleWeeks), selectedWeek: week.number,
    focusWeek: currentWeek, poll: shouldPollLiveScores(week.games),
    hero: null, empty: null,
    games: [...week.games].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    ),
    rows: startNotice ? [] : buildHomeRows(sorted), selfId: self.id,
    startNotice,
  };
}
