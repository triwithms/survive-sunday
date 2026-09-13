import { prisma } from "./db";
import { scheduleResultsNotice } from "./notification-events";
import {
  decideStatusAfterLoss,
  shouldApplyMissedPick,
} from "./pool-rules";

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

export async function applyLossToMembership(
  membershipId: string,
  weekNumber: number
) {
  const m = await prisma.membership.findUniqueOrThrow({
    where: { id: membershipId },
    include: { pool: true },
  });
  if (m.status === "eliminated") return m;

  const decision = decideStatusAfterLoss({
    currentStatus: m.status,
    mulliganRemaining: m.mulliganRemaining,
    weekNumber,
    singleEliminationFromWeek: m.pool.singleEliminationFromWeek,
  });
  if (decision.unchanged) return m;

  return prisma.membership.update({
    where: { id: membershipId },
    data: {
      mulliganRemaining: decision.mulliganRemaining,
      status: decision.status,
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
  const weekRow = await prisma.week.findUnique({
    where: { id: weekId },
    select: { number: true },
  });
  const weekNumber = weekRow?.number ?? 0;
  const picks = await prisma.pick.findMany({
    where: {
      weekId,
      OR: [{ result: null }, { result: "pending" }],
      NOT: { source: "missed" },
    },
    include: { game: true, membership: { include: { user: true } } },
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

    const before = pick.membership;
    let afterStatus = before.status;
    if (result === "loss" || result === "push") {
      afterStatus = (await applyLossToMembership(pick.membershipId, weekNumber))
        .status;
    } else if (result === "win") {
      afterStatus = (await applyWinToMembership(pick.membershipId)).status;
    }
    scheduleResultsNotice({
      user: before.user,
      nickname: before.nickname,
      weekNumber,
      weekId,
      pickId: pick.id,
      teamAbbr: pick.teamAbbr,
      result,
      status: afterStatus,
      mulliganBurned:
        before.mulliganRemaining && afterStatus === "one_loss",
    });
    graded.push(pick.id);
  }
  return graded;
}

/**
 * Apply missed-pick losses for playing members with no pick after lock.
 * Idempotent per membership+week via source=missed pick records.
 * Skips spectator commissioners and members not yet playing this week.
 */
export async function applyMissedPicks(weekId: string) {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: {
      pool: { include: { memberships: { include: { user: true } } } },
      picks: true,
    },
  });

  // Week-level short-circuit when every eligible member already handled
  const picked = new Set(week.picks.map((p) => p.membershipId));
  const applied: string[] = [];

  for (const m of week.pool.memberships) {
    if (!shouldApplyMissedPick(m, week.number)) continue;
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

    const after = await applyLossToMembership(m.id, week.number);
    scheduleResultsNotice({
      user: m.user,
      nickname: m.nickname,
      weekNumber: week.number,
      weekId: week.id,
      pickId: `${m.id}:missed`,
      teamAbbr: MISSED_TEAM,
      result: "missed",
      status: after.status,
      mulliganBurned: m.mulliganRemaining && after.status === "one_loss",
    });

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
  try {
    const { applyMirrorPicksForWeek } = await import("./pick-mirror-db");
    await applyMirrorPicksForWeek(weekId);
  } catch (error) {
    console.warn("[mirror] apply skipped", error);
  }

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

/** Deterministic plausible final score from game id (home slightly favoured). */
export function plausibleFinalScores(gameId: string): {
  scoreHome: number;
  scoreAway: number;
} {
  const seed = gameId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  let homeScore = 17 + (seed % 14);
  const awayScore = 14 + ((seed * 3) % 17);
  // Avoid ties (ties grade as loss)
  if (homeScore === awayScore) homeScore += 1;
  return { scoreHome: homeScore, scoreAway: awayScore };
}

/**
 * Finalize non-final games for a week with plausible scores.
 * Idempotent for already-final games. Does not grade picks.
 */
export async function simulateRemainingGames(
  weekId: string,
  opts?: { gameId?: string }
) {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: { games: true },
  });

  const targets = opts?.gameId
    ? week.games.filter((g) => g.id === opts.gameId)
    : week.games.filter((g) => g.status !== "final");

  const updated = [];
  for (const g of targets) {
    const { scoreHome, scoreAway } = plausibleFinalScores(g.id);
    const row = await prisma.game.update({
      where: { id: g.id },
      data: {
        status: "final",
        scoreHome,
        scoreAway,
      },
    });
    updated.push(row);
  }
  return updated;
}

/**
 * Set weeksSurvived = count of non-missed picks with result === 'win'.
 * Does not touch losses / mulligan / status.
 */
export async function recomputeWeeksSurvived(poolId: string) {
  const members = await prisma.membership.findMany({
    where: { poolId, isParticipant: true },
    include: { picks: true },
  });
  const results: { membershipId: string; weeksSurvived: number }[] = [];
  for (const m of members) {
    const weeksSurvived = m.picks.filter(
      (p) => p.result === "win" && p.source !== "missed" && p.teamAbbr !== MISSED_TEAM
    ).length;
    if (m.weeksSurvived !== weeksSurvived) {
      await prisma.membership.update({
        where: { id: m.id },
        data: { weeksSurvived },
      });
    }
    results.push({ membershipId: m.id, weeksSurvived });
  }
  return results;
}
