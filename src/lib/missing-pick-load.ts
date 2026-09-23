import { prisma } from "./db";
import { effectiveLockAt } from "./grading";
import { toRemindSeat } from "./missing-pick-seat";
import {
  lockLabelToronto,
  seatsMissingPick,
  weekAllowsMissingPickRemind,
  type RemindMode,
  type RemindSeat,
} from "./missing-pick-who";
import { effectiveCurrentWeek } from "./pool-mode";

export type LoadedRemindWeek = {
  id: string;
  number: number;
  lockLabel: string;
  blanks: RemindSeat[];
};

/** Unique (membershipId, weekId) read. Not a stale Week include. */
export async function membershipHasPick(
  membershipId: string,
  weekId: string
): Promise<boolean> {
  const row = await prisma.pick.findUnique({
    where: { membershipId_weekId: { membershipId, weekId } },
    select: { id: true },
  });
  return row != null;
}

/** Picks are loaded by weekId, not via Week.picks include. */
export async function loadRemindWeeks(opts: {
  poolId?: string;
  weekId?: string;
  now: Date;
  mode: RemindMode;
}): Promise<LoadedRemindWeek[]> {
  const number = await adminWeekNumber(opts);
  if (opts.mode === "admin" && number == null) return [];
  const weeks = await prisma.week.findMany({
    where: {
      status: "open",
      ...(opts.poolId ? { poolId: opts.poolId } : {}),
      ...(opts.weekId ? { id: opts.weekId } : {}),
      ...(number != null ? { number } : {}),
    },
    include: {
      pool: { include: { memberships: { include: { user: true } } } },
    },
  });
  const ready: LoadedRemindWeek[] = [];
  for (const week of weeks) {
    const lockAt = effectiveLockAt(week);
    if (
      !weekAllowsMissingPickRemind({
        mode: opts.mode,
        status: week.status,
        lockAt,
        now: opts.now,
      })
    ) {
      continue;
    }
    const picks = await prisma.pick.findMany({
      where: { weekId: week.id },
      select: { membershipId: true },
    });
    const picked = new Set(picks.map((row) => row.membershipId));
    ready.push({
      id: week.id,
      number: week.number,
      lockLabel: lockLabelToronto(lockAt),
      blanks: seatsMissingPick(
        week.pool.memberships.map(toRemindSeat),
        week.number,
        picked
      ),
    });
  }
  return ready.sort((a, b) => a.number - b.number);
}

async function adminWeekNumber(opts: {
  poolId?: string;
  mode: RemindMode;
}): Promise<number | null> {
  if (opts.mode !== "admin" || !opts.poolId) return null;
  const pool = await prisma.pool.findUnique({
    where: { id: opts.poolId },
    select: { mode: true, currentWeek: true },
  });
  if (!pool) return null;
  return effectiveCurrentWeek(pool.mode, pool.currentWeek);
}
