import { prisma } from "./db";
import { effectiveLockAt, parseUsedTeams, rebuildUsedTeams } from "./grading";
import { schedulePickConfirmed } from "./notification-events";
import {
  decideMirrorCopy,
  MIRROR_PICK_SOURCE,
} from "./pick-mirror";
import { isPlayerSeat } from "./roles";

export const MIRROR_PICK_AUDIT = "pick_mirrored";
export const MIRROR_PREF_AUDIT = "mirror_from_updated";

export async function setMembershipMirrorFrom(args: {
  poolId: string;
  membershipId: string;
  sourceMembershipId: string | null;
  actorId?: string | null;
}): Promise<{
  membershipId: string;
  mirrorFromMembershipId: string | null;
  mirrorFromNickname: string | null;
}> {
  const member = await prisma.membership.findFirst({
    where: { id: args.membershipId, poolId: args.poolId },
  });
  if (!member) {
    throw Object.assign(new Error("Member not found"), { status: 404 });
  }
  if (!isPlayerSeat(member)) {
    throw Object.assign(new Error("Commissioner seat cannot mirror picks"), {
      status: 400,
    });
  }

  let sourceId: string | null = null;
  let sourceNickname: string | null = null;
  if (args.sourceMembershipId) {
    if (args.sourceMembershipId === member.id) {
      throw Object.assign(new Error("Choose someone else to copy from"), {
        status: 400,
      });
    }
    const source = await prisma.membership.findFirst({
      where: {
        id: args.sourceMembershipId,
        poolId: args.poolId,
        role: { not: "admin" },
      },
      select: { id: true, nickname: true },
    });
    if (!source) {
      throw Object.assign(new Error("That player is not in this pool"), {
        status: 400,
      });
    }
    sourceId = source.id;
    sourceNickname = source.nickname;
  }

  const updated = await prisma.membership.update({
    where: { id: member.id },
    data: { mirrorFromMembershipId: sourceId },
    select: { id: true, mirrorFromMembershipId: true },
  });

  await prisma.auditLog.create({
    data: {
      poolId: args.poolId,
      actorId: args.actorId ?? null,
      action: MIRROR_PREF_AUDIT,
      targetType: "membership",
      targetId: member.id,
      details: JSON.stringify({
        from: member.mirrorFromMembershipId,
        to: sourceId,
        sourceNickname,
      }),
    },
  });

  return {
    membershipId: updated.id,
    mirrorFromMembershipId: updated.mirrorFromMembershipId,
    mirrorFromNickname: sourceNickname,
  };
}

export async function applyMirrorPicksForWeek(
  weekId: string,
  now: Date = new Date()
): Promise<{ copied: string[] }> {
  const week = await prisma.week.findUnique({
    where: { id: weekId },
    include: {
      games: true,
      pool: {
        include: {
          memberships: {
            include: {
              user: true,
              picks: { where: { weekId } },
            },
          },
        },
      },
    },
  });
  if (!week) return { copied: [] };

  const lockAt = effectiveLockAt(week);
  const byId = new Map(week.pool.memberships.map((m) => [m.id, m]));
  const copied: string[] = [];

  for (const member of week.pool.memberships) {
    if (!isPlayerSeat(member)) continue;
    if (!member.mirrorFromMembershipId) continue;

    const source = byId.get(member.mirrorFromMembershipId) ?? null;
    const sourcePick =
      source?.picks.find(
        (p) => p.source !== "missed" && p.teamAbbr && p.teamAbbr !== "MISS"
      ) ?? null;
    const sourceGame = sourcePick
      ? week.games.find(
          (g) =>
            g.id === sourcePick.gameId ||
            g.awayAbbr === sourcePick.teamAbbr ||
            g.homeAbbr === sourcePick.teamAbbr
        ) ?? null
      : null;
    const ownPick = member.picks[0] ?? null;
    const teamPlaying = Boolean(
      sourcePick &&
        week.games.some(
          (g) =>
            g.awayAbbr === sourcePick.teamAbbr ||
            g.homeAbbr === sourcePick.teamAbbr
        )
    );

    const decision = decideMirrorCopy({
      now,
      weekNumber: week.number,
      weekLockAt: lockAt,
      existingPick: ownPick,
      sourceMembershipId: member.mirrorFromMembershipId,
      memberId: member.id,
      sourcePick: sourcePick
        ? {
            teamAbbr: sourcePick.teamAbbr,
            gameKickoff: sourceGame?.kickoff ?? null,
          }
        : null,
      usedTeams: parseUsedTeams(member.usedTeamsJson),
      teamPlaying,
      eliminated: member.status === "eliminated",
    });
    if (decision.action !== "copy") continue;

    const game = week.games.find(
      (g) =>
        g.awayAbbr === decision.teamAbbr || g.homeAbbr === decision.teamAbbr
    );
    try {
      await prisma.pick.create({
        data: {
          membershipId: member.id,
          weekId: week.id,
          teamAbbr: decision.teamAbbr,
          gameId: game?.id ?? null,
          source: MIRROR_PICK_SOURCE,
          result: "pending",
        },
      });
    } catch {
      continue;
    }

    await rebuildUsedTeams(member.id);
    await prisma.auditLog.create({
      data: {
        poolId: week.poolId,
        action: MIRROR_PICK_AUDIT,
        targetType: "membership",
        targetId: member.id,
        details: JSON.stringify({
          weekId: week.id,
          weekNumber: week.number,
          teamAbbr: decision.teamAbbr,
          fromMembershipId: member.mirrorFromMembershipId,
          fromNickname: source?.nickname ?? null,
        }),
      },
    });
    schedulePickConfirmed({
      user: member.user,
      nickname: member.nickname,
      weekNumber: week.number,
      weekId: week.id,
      teamAbbr: decision.teamAbbr,
      changed: false,
    });
    copied.push(member.id);
  }

  return { copied };
}

export async function applyMirrorPicksForActiveWeeks(
  now: Date = new Date()
): Promise<{ weeks: number; copied: number }> {
  const { effectiveCurrentWeek } = await import("./pool-mode");
  const pools = await prisma.pool.findMany({
    select: { id: true, mode: true, currentWeek: true },
  });
  let weeks = 0;
  let copied = 0;
  for (const pool of pools) {
    const number = effectiveCurrentWeek(pool.mode, pool.currentWeek);
    const week = await prisma.week.findUnique({
      where: { poolId_number: { poolId: pool.id, number } },
      select: { id: true },
    });
    if (!week) continue;
    weeks += 1;
    const result = await applyMirrorPicksForWeek(week.id, now);
    copied += result.copied.length;
  }
  return { weeks, copied };
}
