import "server-only";
import { prisma } from "./db";
import { isWeekLocked } from "./grading";
import { allowedEnterPickWeeks } from "./enter-pick-week";
import { effectiveCurrentWeek } from "./pool-mode";

export async function assertEnterPickWeek(opts: {
  poolId: string;
  mode: string;
  storedCurrentWeek: number;
  weekNumber: number;
  nickname: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const currentWeek = effectiveCurrentWeek(opts.mode, opts.storedCurrentWeek);
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
  if (!member) return { ok: false, error: "Member not found (nickname or email)" };
  const allowed = allowedEnterPickWeeks({
    currentWeek,
    weeks: weeks.map((w) => ({
      number: w.number,
      locked: isWeekLocked(w),
      games: w.games,
    })),
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
