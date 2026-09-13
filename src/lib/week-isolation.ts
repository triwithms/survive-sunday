import type { PrismaClient } from "@prisma/client";
import {
  DEMO_SANDBOX_WEEK,
  POOL_MODE_DEMO,
  POOL_MODE_LIVE,
  REAL_CURRENT_WEEK,
  isLiveMode,
} from "./pool-mode";
import { parseUsedTeams } from "./grading";

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

/** Delete Week 2 sandbox picks and park the live pool on Week 1. */
export async function applyRealModeIsolation(
  db: PrismaClient,
  poolId: string
): Promise<WeekIsolationResult> {
  const week = await db.week.findUnique({
    where: { poolId_number: { poolId, number: DEMO_SANDBOX_WEEK } },
    include: { picks: true },
  });

  let clearedPicks = 0;
  if (week) {
    const sandboxTeamsByMember = new Map<string, string[]>();
    for (const pick of week.picks) {
      await undoSandboxPickEffect(db, pick.membershipId, pick.result);
      if (pick.teamAbbr && pick.teamAbbr !== "MISS") {
        const list = sandboxTeamsByMember.get(pick.membershipId) ?? [];
        list.push(pick.teamAbbr);
        sandboxTeamsByMember.set(pick.membershipId, list);
      }
    }
    const deleted = await db.pick.deleteMany({ where: { weekId: week.id } });
    clearedPicks = deleted.count;

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

    await db.week.update({
      where: { id: week.id },
      data: {
        lockOverrideAt: null,
        missedPicksAppliedAt: null,
      },
    });
  }

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

/** Demo mode: commissioner sandbox sits on Week 2. Does not re-seed picks. */
export async function applyDemoModeSandbox(
  db: PrismaClient,
  poolId: string
): Promise<WeekIsolationResult> {
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
 * If the pool is live, force Week 1 and clear leftover Week 2 picks.
 * No-op when already isolated.
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

  const sandbox = await db.week.findUnique({
    where: { poolId_number: { poolId: pool.id, number: DEMO_SANDBOX_WEEK } },
    select: { id: true, _count: { select: { picks: true } } },
  });
  const needsSnap = pool.currentWeek !== REAL_CURRENT_WEEK;
  const needsClear = Boolean(sandbox && sandbox._count.picks > 0);
  if (!needsSnap && !needsClear) {
    return {
      changed: false,
      clearedPicks: 0,
      currentWeek: REAL_CURRENT_WEEK,
    };
  }
  return applyRealModeIsolation(db, pool.id);
}
