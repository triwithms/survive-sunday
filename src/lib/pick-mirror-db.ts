import { prisma } from "./db";
import { effectiveLockAt, parseUsedTeams, rebuildUsedTeams } from "./grading";
import { schedulePickConfirmed } from "./notification-events";
import {
  bestRemainingRankedTeam,
  decideRankedAutoPick,
  isPickBackupMode,
  PICK_BACKUP_OFF,
  PICK_BACKUP_RANKED,
  RANKED_PICK_SOURCE,
  resolvePickBackupMode,
  type PickBackupMode,
} from "./pick-mirror";
import { shouldStampAutoPick } from "./auto-pick-stamps";
import { isPlayerSeat } from "./roles";

export const RANKED_PICK_AUDIT = "pick_ranked_auto";
export const MIRROR_PREF_AUDIT = "mirror_from_updated";
/** @deprecated leftover audit name for historic copy-from rows */
export const MIRROR_PICK_AUDIT = "pick_mirrored";

export async function setMembershipPickBackup(args: {
  poolId: string;
  membershipId: string;
  mode: PickBackupMode;
  sourceMembershipId?: string | null;
  actorId?: string | null;
}): Promise<{
  membershipId: string;
  pickBackup: PickBackupMode;
  mirrorFromMembershipId: null;
  mirrorFromNickname: null;
}> {
  const member = await prisma.membership.findFirst({
    where: { id: args.membershipId, poolId: args.poolId },
  });
  if (!member) {
    throw Object.assign(new Error("Member not found"), { status: 404 });
  }
  if (!isPlayerSeat(member)) {
    throw Object.assign(new Error("Administrator seat cannot set pick backup"), {
      status: 400,
    });
  }

  const mode = args.mode === PICK_BACKUP_OFF ? PICK_BACKUP_OFF : PICK_BACKUP_RANKED;
  const updated = await prisma.membership.update({
    where: { id: member.id },
    data: { pickBackup: mode, mirrorFromMembershipId: null },
    select: { id: true, pickBackup: true },
  });

  await prisma.auditLog.create({
    data: {
      poolId: args.poolId,
      actorId: args.actorId ?? null,
      action: MIRROR_PREF_AUDIT,
      targetType: "membership",
      targetId: member.id,
      details: JSON.stringify({
        from: { pickBackup: member.pickBackup },
        to: { pickBackup: updated.pickBackup },
      }),
    },
  });

  return {
    membershipId: updated.id,
    pickBackup: resolvePickBackupMode(updated.pickBackup),
    mirrorFromMembershipId: null,
    mirrorFromNickname: null,
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
    mode: args.sourceMembershipId ? PICK_BACKUP_RANKED : PICK_BACKUP_OFF,
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
            include: { user: true, picks: { where: { weekId } } },
          },
        },
      },
    },
  });
  if (!week) return { copied: [] };

  const lockAt = effectiveLockAt(week);
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
    if (mode !== PICK_BACKUP_RANKED) continue;

    const ownPick = member.picks[0] ?? null;
    const usedTeams = parseUsedTeams(member.usedTeamsJson);
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
  week: {
    id: string;
    poolId: string;
    number: number;
    games: { id: string; awayAbbr: string; homeAbbr: string }[];
  };
  teamAbbr: string;
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
        source: RANKED_PICK_SOURCE,
        result: "pending",
      },
    });
  } catch {
    return false;
  }
  if (shouldStampAutoPick(RANKED_PICK_SOURCE)) {
    await prisma.membership.update({
      where: { id: args.member.id },
      data: { autoPickStamps: { increment: 1 } },
    });
  }
  await rebuildUsedTeams(args.member.id);
  await prisma.auditLog.create({
    data: {
      poolId: args.week.poolId,
      action: RANKED_PICK_AUDIT,
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
