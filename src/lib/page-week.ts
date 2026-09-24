import "server-only";
import { prisma } from "@/lib/db";
import { isWeekLocked } from "@/lib/grading";
import {
  resolvePlayerPickWeekFromLoaded,
  type PlayerPickWeek,
} from "@/lib/next-week-picks";
import { resolvedPoolWeek } from "@/lib/pool-current-week-db";
import { effectiveCurrentWeek, weeksForParticipants } from "@/lib/pool-mode";
import { parseWeekParam, resolvePageWeekNumber } from "@/lib/weeks";
import type { ExistingPickBits } from "@/lib/pick-change";

const weekGameSelect = {
  id: true,
  status: true,
  kickoff: true,
  awayAbbr: true,
  homeAbbr: true,
} as const;

export type PageWeekRow = {
  id: string; number: number; label: string;
  lockAt: Date; lockOverrideAt: Date | null;
  hasGames: boolean;
  games: Array<{
    id: string; status: string; kickoff: Date;
    awayAbbr: string; homeAbbr: string;
  }>;
  pick: ExistingPickBits;
};

type MemberForDecision = {
  id: string; poolId: string; playingFromWeek: number | null;
  pool: { mode: string; currentWeek: number };
};

async function loadDecisionPair(me: MemberForDecision, currentWeek: number) {
  return prisma.week.findMany({
    where: { poolId: me.poolId, number: { in: [currentWeek, currentWeek + 1] } },
    orderBy: { number: "asc" },
    select: {
      id: true, number: true, label: true, lockAt: true, lockOverrideAt: true,
      games: { select: weekGameSelect },
      picks: {
        where: { membershipId: me.id },
        select: {
          source: true, teamAbbr: true, gameId: true, result: true,
        },
      },
    },
  });
}

export async function loadParticipantWeeks(me: MemberForDecision) {
  let currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const [weekRefs, firstPair] = await Promise.all([
    prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      select: {
        id: true, number: true, label: true, lockAt: true, lockOverrideAt: true,
        _count: { select: { games: true } },
      },
    }),
    loadDecisionPair(me, currentWeek),
  ]);
  const decisionWeeks = new Map<number, Awaited<ReturnType<typeof loadDecisionPair>>[number]>();
  let pair = firstPair;
  for (let attempt = 0; attempt <= weekRefs.length; attempt += 1) {
    pair.forEach((week) => decisionWeeks.set(week.number, week));
    const resolved = resolvedPoolWeek(me.pool.mode, currentWeek, pair).currentWeek;
    if (resolved === currentWeek) break;
    currentWeek = resolved;
    pair = await loadDecisionPair(me, currentWeek);
  }
  const weeks = weeksForParticipants(me.pool.mode, weekRefs).map((ref) => {
    const decision = decisionWeeks.get(ref.number);
    return {
      id: ref.id, number: ref.number, label: ref.label,
      lockAt: ref.lockAt, lockOverrideAt: ref.lockOverrideAt,
      hasGames: ref._count.games > 0,
      games: decision?.games ?? [],
      pick: decision?.picks[0] ?? null,
    };
  });
  return { currentWeek, weeks };
}

export function playerPickDecision(
  me: MemberForDecision,
  weeks: PageWeekRow[],
  currentWeek: number
): PlayerPickWeek {
  const currentWeekRow = weeks.find((row) => row.number === currentWeek);
  const nextWeekRow = weeks.find((row) => row.number === currentWeek + 1);
  return resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick: currentWeekRow?.pick ?? null,
    nextPick: nextWeekRow?.pick ?? null,
    playingFromWeek: me.playingFromWeek,
  });
}

export function selectPageWeek<T extends { number: number }>(opts: {
  weeks: T[];
  requested: string | string[] | undefined;
  basePath: "/pool" | "/pick" | "/scores" | "/videos" | "/schedule";
  currentWeek: number;
  actionWeek: number;
  allowFuture: boolean;
  fallbackFirst: boolean;
}): T | undefined {
  const selectedNumber = resolvePageWeekNumber({
    requested: parseWeekParam(opts.requested),
    weekNumbers: opts.weeks.map((week) => week.number),
    basePath: opts.basePath,
    poolCurrentWeek: opts.currentWeek,
    pickActionWeek: opts.actionWeek,
    allowFuture: opts.allowFuture,
  });
  return (
    opts.weeks.find((week) => week.number === selectedNumber) ??
    opts.weeks.find((week) => week.number === opts.actionWeek) ??
    (opts.fallbackFirst ? opts.weeks[0] : undefined)
  );
}

export function weekNavOptions(weeks: PageWeekRow[]) {
  return weeks.map((week) => ({
    number: week.number,
    label: week.label,
    hasGames: week.hasGames,
  }));
}

export async function pageWeekNumberForGame(
  poolId: string,
  gameId: string | null
): Promise<number | undefined> {
  if (!gameId) return undefined;
  const game = await prisma.game.findFirst({
    where: { id: gameId, week: { poolId } },
    select: { week: { select: { number: true } } },
  });
  return game?.week.number;
}
