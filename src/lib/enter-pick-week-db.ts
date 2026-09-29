import "server-only";
import { prisma } from "./db";
import { overlayPoolWeeks } from "./slate-games";
import { isWeekLocked } from "./grading";
import { allowedEnterPickWeeks } from "./enter-pick-week";
import { enterPickStatusError } from "./enter-pick-status";
import { effectiveCurrentWeek } from "./pool-mode";
import { pickBeforePoolStartError } from "./pool-start-week";

export async function assertEnterPickWeek(opts: {
  poolId: string;
  mode: string;
  storedCurrentWeek: number;
  weekNumber: number;
  nickname: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentWeek = effectiveCurrentWeek(opts.mode, opts.storedCurrentWeek);
  const pool = await prisma.pool.findUnique({
    where: { id: opts.poolId },
    select: { startWeek: true },
  });
  const beforeStart = pickBeforePoolStartError(pool?.startWeek, opts.weekNumber);
  if (beforeStart) return { ok: false, error: beforeStart };
  if (opts.weekNumber > currentWeek + 1) {
    return { ok: false, error: "Far-future weeks are not open for override." };
  }
  const [weeks, member] = await Promise.all([
    prisma.week.findMany({
      where: { poolId: opts.poolId },
      select: {
        number: true,
        lockAt: true,
        lockOverrideAt: true,
        games: {
          select: {
            id: true,
            awayAbbr: true,
            homeAbbr: true,
            status: true,
            kickoff: true,
          },
        },
      },
    }),
    prisma.membership.findFirst({
      where: {
        poolId: opts.poolId,
        nickname: { equals: opts.nickname, mode: "insensitive" },
      },
      select: {
        status: true,
        playingFromWeek: true,
        picks: {
          select: {
            teamAbbr: true,
            source: true,
            gameId: true,
            week: { select: { number: true } },
          },
        },
      },
    }),
  ]);
  const slateWeeks = await overlayPoolWeeks(opts.poolId, weeks);
  if (!member) return { ok: false, error: "Member not found (nickname or email)" };
  const blocked = enterPickStatusError(member.status);
  if (blocked) return { ok: false, error: blocked };
  const allowed = allowedEnterPickWeeks({
    currentWeek,
    weeks: slateWeeks.map((w) => ({
      number: w.number,
      locked: isWeekLocked(w),
      games: w.games,
    })),
    startWeek: pool?.startWeek,
    member: {
      playingFromWeek: member.playingFromWeek,
      picks: member.picks.map((p) => ({
        weekNumber: p.week.number,
        teamAbbr: p.teamAbbr,
        source: p.source,
        gameId: p.gameId,
      })),
    },
  });
  if (!allowed.includes(opts.weekNumber)) {
    return { ok: false, error: "That week is not open for this friend yet." };
  }
  return { ok: true };
}
