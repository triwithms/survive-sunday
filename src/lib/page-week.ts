import "server-only";
import { prisma } from "@/lib/db";
import { isWeekLocked } from "@/lib/grading";
import {
  resolvePlayerPickWeekFromLoaded,
  type PlayerPickWeek,
} from "@/lib/next-week-picks";
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
  games: Array<{
    id: string; status: string; kickoff: Date;
    awayAbbr: string; homeAbbr: string;
  }>;
};

type MemberForDecision = {
  poolId: string; playingFromWeek: number | null;
  pool: { mode: string; currentWeek: number };
  picks: Array<ExistingPickBits & { weekId: string }>;
};

export async function loadParticipantWeeks(me: MemberForDecision) {
  const currentWeek = effectiveCurrentWeek(me.pool.mode, me.pool.currentWeek);
  const weeks = weeksForParticipants(
    me.pool.mode,
    await prisma.week.findMany({
      where: { poolId: me.poolId },
      orderBy: { number: "asc" },
      include: { games: { select: weekGameSelect } },
    })
  ) as PageWeekRow[];
  return { currentWeek, weeks };
}

export function playerPickDecision(
  me: MemberForDecision,
  weeks: PageWeekRow[],
  currentWeek: number
): PlayerPickWeek {
  const currentWeekRow = weeks.find((row) => row.number === currentWeek);
  const currentPick = currentWeekRow
    ? me.picks.find((p) => p.weekId === currentWeekRow.id) ?? null
    : null;
  return resolvePlayerPickWeekFromLoaded({
    poolCurrentWeek: currentWeek,
    weeks: weeks.map((row) => ({
      number: row.number,
      locked: isWeekLocked(row),
      games: row.games,
    })),
    currentPick,
    playingFromWeek: me.playingFromWeek,
  });
}

export function selectPageWeek<T extends { number: number }>(opts: {
  weeks: T[];
  requested: string | string[] | undefined;
  basePath: "/pool" | "/pick" | "/scores" | "/videos";
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
    hasGames: week.games.length > 0,
  }));
}
