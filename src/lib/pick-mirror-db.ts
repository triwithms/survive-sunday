import { prisma } from "./db";
import { effectiveLockAt, parseUsedTeams, rebuildUsedTeams } from "./grading";
import { schedulePickConfirmed } from "./notification-events";
import {
  bestRemainingRankedTeam,
  decideMirrorCopy,
  decideRankedAutoPick,
  isPickBackupMode,
  MIRROR_PICK_SOURCE,
  PICK_BACKUP_MIRROR,
  PICK_BACKUP_OFF,
  RANKED_PICK_SOURCE,
  resolvePickBackupMode,
  type PickBackupMode,
} from "./pick-mirror";
import { shouldStampAutoPick } from "./auto-pick-stamps";
import { isPlayerSeat } from "./roles";

export const MIRROR_PICK_AUDIT = "pick_mirrored";
export const RANKED_PICK_AUDIT = "pick_ranked_auto";
export const MIRROR_PREF_AUDIT = "mirror_from_updated";

export async function setMembershipPickBackup(args: {
  poolId: string;
  membershipId: string;
  mode: PickBackupMode;
  sourceMembershipId: string | null;
  actorId?: string | null;
}): Promise<{
  membershipId: string;
  pickBackup: PickBackupMode;
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
  if (args.mode === PICK_BACKUP_MIRROR) {
    if (!args.sourceMembershipId) {
      throw Object.assign(new Error("Choose a player to copy from"), {
        status: 400,
      });
    }
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
    data: {
      pickBackup: args.mode,
      mirrorFromMembershipId: sourceId,
    },
    select: { id: true, pickBackup: true, mirrorFromMembershipId: true },
  });

  await prisma.auditLog.create({
    data: {
      poolId: args.poolId,
      actorId: args.actorId ?? null,
      action: MIRROR_PREF_AUDIT,
      targetType: "membership",
      targetId: member.id,
      details: JSON.stringify({
        from: {
          pickBackup: member.pickBackup,
          mirrorFromMembershipId: member.mirrorFromMembershipId,
        },
        to: {
          pickBackup: updated.pickBackup,
          mirrorFromMembershipId: sourceId,
        },
        sourceNickname,
      }),
    },
  });

  return {
    membershipId: updated.id,
    pickBackup: resolvePickBackupMode(
      updated.pickBackup,
      updated.mirrorFromMembershipId
    ),
    mirrorFromMembershipId: updated.mirrorFromMembershipId,
    mirrorFromNickname: sourceNickname,
  };
}

/** @deprecated use setMembershipPickBackup */
export async function setMembershipMirrorFrom(args: {
  poolId: string;
  membershipId: string;
  sourceMembershipId: string | null;
  actorId?: string | null;
}) {
  return setMembershipPickBackup({
    ...args,
    mode: args.sourceMembershipId ? PICK_BACKUP_MIRROR : PICK_BACKUP_OFF,
  });
}

export { isPickBackupMode };

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
  const ranks = await prisma.team.findMany({
    select: { abbr: true, priorYearRank: true },
  });
  const copied: string[] = [];

  for (const member of week.pool.memberships) {
    if (!isPlayerSeat(member)) continue;
    const mode = resolvePickBackupMode(
      member.pickBackup,
      member.mirrorFromMembershipId
    );
    if (mode === PICK_BACKUP_OFF) continue;

    const ownPick = member.picks[0] ?? null;
    const usedTeams = parseUsedTeams(member.usedTeamsJson);

    if (mode === PICK_BACKUP_MIRROR) {
      const source = byId.get(member.mirrorFromMembershipId ?? "") ?? null;
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
        usedTeams,
        teamPlaying,
        eliminated: member.status === "eliminated",
      });
      if (decision.action !== "copy") continue;
      const wrote = await writeBackupPick({
        member,
        week,
        teamAbbr: decision.teamAbbr,
        source: MIRROR_PICK_SOURCE,
        auditAction: MIRROR_PICK_AUDIT,
        extra: {
          fromMembershipId: member.mirrorFromMembershipId,
          fromNickname: source?.nickname ?? null,
        },
      });
      if (wrote) copied.push(member.id);
      continue;
    }

    const best = bestRemainingRankedTeam({
      games: week.games,
      usedTeams,
      ranks,
      now,
    });
    const decision = decideRankedAutoPick({
      now,
      weekLockAt: lockAt,
      existingPick: ownPick,
      eliminated: member.status === "eliminated",
      teamAbbr: best?.teamAbbr ?? null,
    });
    if (decision.action !== "copy") continue;
    const wrote = await writeBackupPick({
      member,
      week,
      teamAbbr: decision.teamAbbr,
      source: RANKED_PICK_SOURCE,
      auditAction: RANKED_PICK_AUDIT,
      extra: {
        ranking: "2025 prior-year composite (Pick: 2025 rank #N)",
        priorYearRank: best?.priorYearRank ?? null,
      },
    });
    if (wrote) copied.push(member.id);
  }

  return { copied };
}

async function writeBackupPick(args: {
  member: {
    id: string;
    nickname: string;
    user: { id: string; email: string | null; phoneE164?: string | null };
  };
  week: { id: string; poolId: string; number: number; games: { id: string; awayAbbr: string; homeAbbr: string }[] };
  teamAbbr: string;
  source: string;
  auditAction: string;
  extra: Record<string, unknown>;
}): Promise<boolean> {
  const game = args.week.games.find(
    (g) => g.awayAbbr === args.teamAbbr || g.homeAbbr === args.teamAbbr
  );
  try {
    await prisma.pick.create({
      data: {
        membershipId: args.member.id,
        weekId: args.week.id,
        teamAbbr: args.teamAbbr,
        gameId: game?.id ?? null,
        source: args.source,
        result: "pending",
      },
    });
  } catch {
    return false;
  }
  if (shouldStampAutoPick(args.source)) {
    await prisma.membership.update({
      where: { id: args.member.id },
      data: { autoPickStamps: { increment: 1 } },
    });
  }
  await rebuildUsedTeams(args.member.id);
  await prisma.auditLog.create({
    data: {
      poolId: args.week.poolId,
      action: args.auditAction,
      targetType: "membership",
      targetId: args.member.id,
      details: JSON.stringify({
        weekId: args.week.id,
        weekNumber: args.week.number,
        teamAbbr: args.teamAbbr,
        ...args.extra,
      }),
    },
  });
  schedulePickConfirmed({
    user: args.member.user,
    nickname: args.member.nickname,
    weekNumber: args.week.number,
    weekId: args.week.id,
    teamAbbr: args.teamAbbr,
    changed: false,
  });
  return true;
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
