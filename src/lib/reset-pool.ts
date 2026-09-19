import { prisma } from "./db";
import { RESET_POOL_CONFIRM } from "./constants";
import { POOL_MODE_LIVE, isDemoEmail } from "./pool-mode";

export type ResetPoolPreview = {
  poolId: string;
  poolName: string;
  pickCount: number;
  demoMembersToRemove: { nickname: string; email: string }[];
  membersKept: { nickname: string; email: string; role: string }[];
  weekCount: number;
};

export type ResetPoolResult = ResetPoolPreview & {
  removedDemoUsers: number;
  membershipsReset: number;
  switchedToLive: boolean;
};

function weekStatusForLock(lockAt: Date, now: Date): "open" | "locked" {
  return now >= lockAt ? "locked" : "open";
}

export async function previewPoolReset(
  poolId: string,
  actorUserId?: string
): Promise<ResetPoolPreview | null> {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) return null;

  const members = await prisma.membership.findMany({
    where: { poolId },
    include: { user: { select: { email: true } } },
    orderBy: { nickname: "asc" },
  });
  const pickCount = await prisma.pick.count({
    where: { membership: { poolId } },
  });
  const weekCount = await prisma.week.count({ where: { poolId } });

  const actor = members.find((m) => m.userId === actorUserId);
  const actorIsReal = Boolean(actor && !isDemoEmail(actor.user.email));

  const demoMembersToRemove: ResetPoolPreview["demoMembersToRemove"] = [];
  const membersKept: ResetPoolPreview["membersKept"] = [];

  for (const m of members) {
    if (m.role === "admin") continue;
    const email = m.user.email ?? "";
    const isActor = Boolean(actorUserId && m.userId === actorUserId);
    const dropDemoMember =
      isDemoEmail(email) && !isActor && (m.role !== "admin" || actorIsReal);
    if (dropDemoMember) {
      demoMembersToRemove.push({ nickname: m.nickname, email });
    } else {
      membersKept.push({
        nickname: m.nickname,
        email,
        role: m.role,
      });
    }
  }

  return {
    poolId: pool.id,
    poolName: pool.name,
    pickCount,
    demoMembersToRemove,
    membersKept,
    weekCount,
  };
}

/**
 * Clear season picks / survival state so Week 1 can be imported cleanly.
 * Does not delete the pool, weeks, games, teams, Auth secrets, or administrator accounts.
 */
export async function resetPoolSeasonData(opts: {
  poolId: string;
  actorUserId: string;
  switchToLive: boolean;
  confirm: string;
}): Promise<ResetPoolResult> {
  if (opts.confirm !== RESET_POOL_CONFIRM) {
    throw new Error("Confirmation phrase does not match");
  }

  const preview = await previewPoolReset(opts.poolId, opts.actorUserId);
  if (!preview) {
    throw new Error("Pool not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    const picks = await tx.pick.deleteMany({
      where: { membership: { poolId: opts.poolId } },
    });

    const actorUser = await tx.user.findUnique({
      where: { id: opts.actorUserId },
      select: { email: true },
    });
    const actorIsReal = !isDemoEmail(actorUser?.email);

    const resetCandidates = await tx.membership.findMany({
      where: {
        poolId: opts.poolId,
        userId: { not: opts.actorUserId },
        ...(actorIsReal ? {} : { role: { not: "admin" } }),
      },
      select: { id: true, userId: true, user: { select: { email: true } } },
    });
    const demoMemberships = resetCandidates.filter((m) =>
      isDemoEmail(m.user.email)
    );

    const demoMembershipIds = demoMemberships.map((m) => m.id);
    const demoUserIds = [...new Set(demoMemberships.map((m) => m.userId))];

    if (demoMembershipIds.length) {
      await tx.membership.deleteMany({
        where: { id: { in: demoMembershipIds } },
      });
    }

    let removedDemoUsers = 0;
    for (const userId of demoUserIds) {
      if (userId === opts.actorUserId) continue;
      const leftover = await tx.membership.count({ where: { userId } });
      if (leftover > 0) continue;
      await tx.user.delete({ where: { id: userId } });
      removedDemoUsers += 1;
    }

    const membershipsReset = await tx.membership.updateMany({
      where: { poolId: opts.poolId },
      data: {
        status: "undefeated",
        mulliganRemaining: true,
        losses: 0,
        weeksSurvived: 0,
        usedTeamsJson: "[]",
        autoPickStamps: 0,
      },
    });

    await tx.week.updateMany({
      where: { poolId: opts.poolId },
      data: {
        lockOverrideAt: null,
        missedPicksAppliedAt: null,
      },
    });

    const weeks = await tx.week.findMany({
      where: { poolId: opts.poolId },
      select: { id: true, lockAt: true },
    });
    const now = new Date();
    for (const week of weeks) {
      await tx.week.update({
        where: { id: week.id },
        data: { status: weekStatusForLock(week.lockAt, now) },
      });
    }

    await tx.pool.update({
      where: { id: opts.poolId },
      data: {
        currentWeek: 1,
        ...(opts.switchToLive ? { mode: POOL_MODE_LIVE } : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        poolId: opts.poolId,
        actorId: opts.actorUserId,
        action: "reset_pool_season",
        targetType: "pool",
        targetId: opts.poolId,
        details: JSON.stringify({
          picksCleared: picks.count,
          demoMembersRemoved: demoMembershipIds.length,
          removedDemoUsers,
          membershipsReset: membershipsReset.count,
          switchedToLive: opts.switchToLive,
          currentWeek: 1,
          note: "Season data reset for clean Week 1 import. Auth/env/pool/schedule kept.",
        }),
      },
    });

    return {
      picksCleared: picks.count,
      removedDemoUsers,
      membershipsReset: membershipsReset.count,
    };
  });

  return {
    ...preview,
    pickCount: result.picksCleared,
    removedDemoUsers: result.removedDemoUsers,
    membershipsReset: result.membershipsReset,
    switchedToLive: opts.switchToLive,
  };
}
