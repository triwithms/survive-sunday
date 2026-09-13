import type { PrismaClient } from "@prisma/client";
import {
  DEMO_SANDBOX_WEEK,
  POOL_MODE_DEMO,
  POOL_MODE_LIVE,
  REAL_CURRENT_WEEK,
  isDemoEmail,
  isLiveMode,
} from "./pool-mode";
import { parseUsedTeams } from "./grading";
import { ensureWeek2Slate } from "./ensure-week-slate";

export type WeekIsolationResult = {
  changed: boolean;
  clearedPicks: number;
  currentWeek: number;
};

async function undoSandboxPickEffect(
  db: PrismaClient,
  membershipId: string,
  result: string | null | undefined
) {
  if (!result || result === "pending") return;
  const m = await db.membership.findUnique({ where: { id: membershipId } });
  if (!m) return;
  if (result === "win") {
    await db.membership.update({
      where: { id: membershipId },
      data: { weeksSurvived: Math.max(0, m.weeksSurvived - 1) },
    });
    return;
  }
  if (result === "loss" || result === "push") {
    const losses = Math.max(0, m.losses - 1);
    if (losses <= 0) {
      await db.membership.update({
        where: { id: membershipId },
        data: { losses: 0, mulliganRemaining: true, status: "undefeated" },
      });
      return;
    }
    if (losses === 1) {
      await db.membership.update({
        where: { id: membershipId },
        data: { losses: 1, mulliganRemaining: false, status: "one_loss" },
      });
      return;
    }
    await db.membership.update({
      where: { id: membershipId },
      data: { losses, mulliganRemaining: false, status: "eliminated" },
    });
  }
}

/** Clear Week 2 picks that belong to practice (@survivesunday.demo) seats only. */
async function clearDemoEmailWeek2Picks(
  db: PrismaClient,
  poolId: string
): Promise<number> {
  const week = await db.week.findUnique({
    where: { poolId_number: { poolId, number: DEMO_SANDBOX_WEEK } },
    include: {
      picks: {
        include: {
          membership: { include: { user: { select: { email: true } } } },
        },
      },
    },
  });
  if (!week) return 0;

  const demoPicks = week.picks.filter((pick) =>
    isDemoEmail(pick.membership.user.email)
  );
  if (demoPicks.length === 0) return 0;

  const sandboxTeamsByMember = new Map<string, string[]>();
  for (const pick of demoPicks) {
    await undoSandboxPickEffect(db, pick.membershipId, pick.result);
    if (pick.teamAbbr && pick.teamAbbr !== "MISS") {
      const list = sandboxTeamsByMember.get(pick.membershipId) ?? [];
      list.push(pick.teamAbbr);
      sandboxTeamsByMember.set(pick.membershipId, list);
    }
  }
  await db.pick.deleteMany({
    where: { id: { in: demoPicks.map((pick) => pick.id) } },
  });

  for (const [membershipId, teams] of sandboxTeamsByMember) {
    const member = await db.membership.findUnique({
      where: { id: membershipId },
      select: { usedTeamsJson: true },
    });
    if (!member) continue;
    const used = parseUsedTeams(member.usedTeamsJson).filter(
      (team) => !teams.includes(team)
    );
    await db.membership.update({
      where: { id: membershipId },
      data: { usedTeamsJson: JSON.stringify(used) },
    });
  }

  return demoPicks.length;
}

/**
 * Park the live pool on Week 1. Restore the Week 2 NFL slate.
 * Clears leftover demo-seat Week 2 picks only — never deletes games
 * or real players' Week 2 picks.
 */
export async function applyRealModeIsolation(
  db: PrismaClient,
  poolId: string
): Promise<WeekIsolationResult> {
  try {
    await ensureWeek2Slate(db, poolId);
  } catch (error) {
    console.warn("Week 2 slate restore skipped", error);
  }
  const clearedPicks = await clearDemoEmailWeek2Picks(db, poolId);

  await db.pool.update({
    where: { id: poolId },
    data: { mode: POOL_MODE_LIVE, currentWeek: REAL_CURRENT_WEEK },
  });

  return {
    changed: true,
    clearedPicks,
    currentWeek: REAL_CURRENT_WEEK,
  };
}

/** Demo mode: commissioner practice UX sits on Week 2. Does not re-seed picks. */
export async function applyDemoModeSandbox(
  db: PrismaClient,
  poolId: string
): Promise<WeekIsolationResult> {
  try {
    await ensureWeek2Slate(db, poolId);
  } catch (error) {
    console.warn("Week 2 slate restore skipped", error);
  }
  await db.pool.update({
    where: { id: poolId },
    data: { mode: POOL_MODE_DEMO, currentWeek: DEMO_SANDBOX_WEEK },
  });
  return {
    changed: true,
    clearedPicks: 0,
    currentWeek: DEMO_SANDBOX_WEEK,
  };
}

/**
 * If the pool is live, keep current week on Week 1.
 * Does not wipe Week 2 picks or games — slate restore happens on deploy
 * and when the commissioner taps Real mode.
 */
export async function ensureLiveWeekIsolation(
  db: PrismaClient,
  pool: { id: string; mode: string; currentWeek: number }
): Promise<WeekIsolationResult> {
  if (!isLiveMode(pool.mode)) {
    return {
      changed: false,
      clearedPicks: 0,
      currentWeek: pool.currentWeek,
    };
  }

  const needsSnap = pool.currentWeek !== REAL_CURRENT_WEEK;
  if (!needsSnap) {
    return {
      changed: false,
      clearedPicks: 0,
      currentWeek: REAL_CURRENT_WEEK,
    };
  }

  await db.pool.update({
    where: { id: pool.id },
    data: { currentWeek: REAL_CURRENT_WEEK },
  });
  return {
    changed: true,
    clearedPicks: 0,
    currentWeek: REAL_CURRENT_WEEK,
  };
}
