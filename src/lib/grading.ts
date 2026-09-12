import { prisma } from "./db";

export type GradeResult = "win" | "loss" | "push";

export const MISSED_TEAM = "MISS";

/** Ties count as loss unless admin override later. */
export function gradePickFromScore(
  teamAbbr: string,
  game: {
    awayAbbr: string;
    homeAbbr: string;
    scoreAway: number | null;
    scoreHome: number | null;
    status: string;
  }
): GradeResult | "pending" {
  if (game.status !== "final" || game.scoreAway == null || game.scoreHome == null) {
    return "pending";
  }
  if (game.scoreAway === game.scoreHome) {
    return "loss"; // strict: tie = loss
  }
  const winner =
    game.scoreAway > game.scoreHome ? game.awayAbbr : game.homeAbbr;
  return teamAbbr === winner ? "win" : "loss";
}

export function parseUsedTeams(json: string | null | undefined): string[] {
  try {
    const arr = JSON.parse(json || "[]");
    return Array.isArray(arr) ? arr.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Rebuild usedTeamsJson from all non-missed picks (prior weeks + current pick)
 * plus seed/history teams, excluding a freed (replaced-before-lock) team.
 * Changing KC→BUF before lock frees KC.
 */
export async function rebuildUsedTeams(
  membershipId: string,
  opts?: { freedTeam?: string | null }
) {
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: { picks: true },
  });
  const fromPicks = m.picks
    .filter((p) => p.source !== "missed" && p.teamAbbr !== MISSED_TEAM)
    .map((p) => p.teamAbbr);
  const prev = parseUsedTeams(m.usedTeamsJson);
  const freed = opts?.freedTeam ?? null;
  const extras = prev.filter(
    (t) => !fromPicks.includes(t) && t !== freed && t !== MISSED_TEAM
  );
  const merged = Array.from(new Set([...fromPicks, ...extras]));
  return prisma.membership.update({
    where: { id: membershipId },
    data: { usedTeamsJson: JSON.stringify(merged) },
  });
}

export async function applyLossToMembership(membershipId: string) {
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
  });
  if (m.status === "eliminated") return m;

  if (m.mulliganRemaining) {
    return prisma.membership.update({
      where: { id: membershipId },
      data: {
        mulliganRemaining: false,
        status: "one_loss",
        losses: m.losses + 1,
      },
    });
  }
  return prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: "eliminated",
      losses: m.losses + 1,
    },
  });
}

export async function applyWinToMembership(membershipId: string) {
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
  });
  if (m.status === "eliminated") return m;
  return prisma.membership.update({
    where: { id: membershipId },
    data: { weeksSurvived: m.weeksSurvived + 1 },
  });
}

/** Reverse one graded pick's membership effect (for import team changes). */
export async function undoPickMembershipEffect(
  membershipId: string,
  result: string | null | undefined
) {
  if (!result || result === "pending") return;
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
  });
  if (result === "win") {
    return prisma.membership.update({
      where: { id: membershipId },
      data: { weeksSurvived: Math.max(0, m.weeksSurvived - 1) },
    });
  }
  if (result === "loss" || result === "push") {
    const losses = Math.max(0, m.losses - 1);
    if (losses <= 0) {
      return prisma.membership.update({
        where: { id: membershipId },
        data: { losses: 0, mulliganRemaining: true, status: "undefeated" },
      });
    }
    if (losses === 1) {
      return prisma.membership.update({
        where: { id: membershipId },
        data: { losses: 1, mulliganRemaining: false, status: "one_loss" },
      });
    }
    return prisma.membership.update({
      where: { id: membershipId },
      data: { losses, mulliganRemaining: false, status: "eliminated" },
    });
  }
}

/** Grade all pending picks for games that are final. Idempotent: skips non-pending. */
export async function gradeWeekPicks(weekId: string) {
  const picks = await prisma.pick.findMany({
    where: {
      weekId,
      OR: [{ result: null }, { result: "pending" }],
      NOT: { source: "missed" },
    },
    include: { game: true, membership: true },
  });

  const graded: string[] = [];
  for (const pick of picks) {
    if (!pick.game) continue;
    const result = gradePickFromScore(pick.teamAbbr, pick.game);
    if (result === "pending") continue;

    await prisma.pick.update({
      where: { id: pick.id },
      data: { result, gradedAt: new Date() },
    });

    if (result === "loss" || result === "push") {
      await applyLossToMembership(pick.membershipId);
    } else if (result === "win") {
      await applyWinToMembership(pick.membershipId);
    }
    graded.push(pick.id);
  }
  return graded;
}

/**
 * Apply missed-pick losses for member-role players with no pick after lock.
 * Idempotent per membership+week via source=missed pick records.
 * Skips role === 'admin' (commissioner spectator).
 */
export async function applyMissedPicks(weekId: string) {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: { pool: { include: { memberships: true } }, picks: true },
  });

  // Week-level short-circuit when every eligible member already handled
  const picked = new Set(week.picks.map((p) => p.membershipId));
  const applied: string[] = [];

  for (const m of week.pool.memberships) {
    if (m.role === "admin") continue;
    if (m.status === "eliminated") continue;
    if (picked.has(m.id)) continue;

    try {
      await prisma.pick.create({
        data: {
          membershipId: m.id,
          weekId: week.id,
          teamAbbr: MISSED_TEAM,
          source: "missed",
          result: "loss",
          gradedAt: new Date(),
        },
      });
    } catch {
      // Unique (membershipId, weekId) — already applied
      continue;
    }

    await applyLossToMembership(m.id);

    await prisma.auditLog.create({
      data: {
        poolId: week.poolId,
        action: "missed_pick_applied",
        targetType: "membership",
        targetId: m.id,
        details: JSON.stringify({ weekId: week.id, weekNumber: week.number }),
      },
    });

    applied.push(m.id);
  }

  if (!week.missedPicksAppliedAt) {
    await prisma.week.update({
      where: { id: week.id },
      data: { missedPicksAppliedAt: new Date() },
    });
  }

  return applied;
}

export function effectiveLockAt(week: {
  lockAt: Date;
  lockOverrideAt: Date | null;
}): Date {
  return week.lockOverrideAt ?? week.lockAt;
}

/** Time-based lock (respects lockOverrideAt). */
export function isWeekLocked(week: {
  lockAt: Date;
  lockOverrideAt: Date | null;
}): boolean {
  return new Date() >= effectiveLockAt(week);
}

/**
 * Idempotent: after natural or admin lock, apply missed picks once and
 * auto-grade any FINAL games. Safe on pool / picks / standings / scores / import.
 */
export async function ensureWeekLockedEffects(weekId: string) {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
  });

  const timeLocked = isWeekLocked(week);
  if (!timeLocked && week.status !== "locked" && week.status !== "graded") {
    return { locked: false, missed: [] as string[], graded: [] as string[] };
  }

  if (week.status === "open" && timeLocked) {
    await prisma.week.update({
      where: { id: weekId },
      data: { status: "locked" },
    });
  }

  const missed = await applyMissedPicks(weekId);
  const graded = await gradeWeekPicks(weekId);

  return { locked: true, missed, graded };
}
