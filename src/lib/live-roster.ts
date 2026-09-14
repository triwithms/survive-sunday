import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { DEMO_PASSWORD } from "./constants";
import { DEMO_EMAIL_SUFFIX, isDemoEmail } from "./pool-mode";
import { grantPoolRole } from "./roles-db";
import { POOL_ROLES } from "./roles";

export const PENDING_EMAIL_SUFFIX = "@pending.survivesunday.local";

export type CanonicalLiveSeat = {
  nickname: string;
  realName: string;
  practiceEmail: string;
  week1Team: string;
  mirrorFromNickname: string | null;
};

/** Sister seat — Join-claimable practice email, Week 1 DAL. Mirror Gams later. */
export const JAJA_SEAT: CanonicalLiveSeat = {
  nickname: "JaJa",
  realName: "Jacquie Gama",
  practiceEmail: `jaja${DEMO_EMAIL_SUFFIX}`,
  week1Team: "DAL",
  mirrorFromNickname: "Gams",
};

export const CANONICAL_LIVE_SEATS: CanonicalLiveSeat[] = [JAJA_SEAT];

export const LIVE_ROSTER_SEAT_AUDIT = "live_roster_seat_ensured";

export function demoEmailLocal(nickname: string): string {
  return nickname
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function practiceEmailForNickname(nickname: string): string {
  return `${demoEmailLocal(nickname)}${DEMO_EMAIL_SUFFIX}`;
}

export function isPendingPracticeEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(PENDING_EMAIL_SUFFIX);
}

/** Pending.local looks “claimed” on Join. Demo practice emails do not. */
export function needsClaimablePracticeEmail(
  email: string | null | undefined
): boolean {
  if (!email) return true;
  if (isPendingPracticeEmail(email)) return true;
  return false;
}

export type EnsuredSeatResult = {
  nickname: string;
  createdUser: boolean;
  createdMembership: boolean;
  convertedPendingEmail: boolean;
  importedWeek1: boolean;
  mirrorSet: boolean;
};

function nickKey(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Create missing live seats (JaJa) with a Join-claimable practice email,
 * import the official Week 1 team (DAL) if she still has no pick — or
 * correct a leftover imported/mirrored KC — and wire “copy from Gams
 * if no pick within 30 min” for later weeks. Idempotent. Never resets
 * the pool or other members’ picks. Does not stamp 💩.
 */
export async function ensureCanonicalLiveSeats(
  db: PrismaClient,
  poolId: string
): Promise<EnsuredSeatResult[]> {
  const results: EnsuredSeatResult[] = [];
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const seat of CANONICAL_LIVE_SEATS) {
    results.push(await ensureOneLiveSeat(db, poolId, seat, passwordHash));
  }
  return results;
}

async function ensureOneLiveSeat(
  db: PrismaClient,
  poolId: string,
  seat: CanonicalLiveSeat,
  passwordHash: string
): Promise<EnsuredSeatResult> {
  const result: EnsuredSeatResult = {
    nickname: seat.nickname,
    createdUser: false,
    createdMembership: false,
    convertedPendingEmail: false,
    importedWeek1: false,
    mirrorSet: false,
  };

  let membership = await db.membership.findFirst({
    where: { poolId, nickname: { equals: seat.nickname, mode: "insensitive" } },
    include: { user: true },
  });

  if (membership && membership.nickname !== seat.nickname) {
    await db.membership.update({
      where: { id: membership.id },
      data: { nickname: seat.nickname },
    });
    membership = { ...membership, nickname: seat.nickname };
  }

  if (
    membership &&
    (!membership.realName ||
      nickKey(membership.realName) !== nickKey(seat.realName))
  ) {
    const current = (membership.realName ?? "").trim();
    if (!current || nickKey(current) === nickKey(seat.nickname)) {
      await db.membership.update({
        where: { id: membership.id },
        data: { realName: seat.realName },
      });
      membership = { ...membership, realName: seat.realName };
    }
  }

  let userId = membership?.userId ?? null;

  if (!userId) {
    const existingUser = await db.user.findUnique({
      where: { email: seat.practiceEmail },
    });
    if (existingUser) {
      userId = existingUser.id;
      if (!existingUser.passwordHash) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { passwordHash, name: existingUser.name ?? seat.realName },
        });
      }
    } else {
      const created = await db.user.create({
        data: {
          email: seat.practiceEmail,
          name: seat.realName,
          passwordHash,
        },
      });
      userId = created.id;
      result.createdUser = true;
    }
  }

  if (membership && needsClaimablePracticeEmail(membership.user.email)) {
    const emailTaken = await db.user.findUnique({
      where: { email: seat.practiceEmail },
    });
    if (!emailTaken || emailTaken.id === membership.userId) {
      await db.user.update({
        where: { id: membership.userId },
        data: { email: seat.practiceEmail },
      });
      result.convertedPendingEmail = true;
    }
  }

  if (!membership) {
    membership = await db.membership.create({
      data: {
        poolId,
        userId,
        nickname: seat.nickname,
        realName: seat.realName,
        role: "member",
        status: "undefeated",
        mulliganRemaining: true,
      },
      include: { user: true },
    });
    result.createdMembership = true;
  }

  try {
    await grantPoolRole(db, {
      poolId,
      userId: membership.userId,
      role: POOL_ROLES.player,
    });
  } catch (error) {
    console.warn("[live-roster] player role grant skipped", error);
  }

  if (seat.mirrorFromNickname) {
    const source = await db.membership.findFirst({
      where: {
        poolId,
        role: { not: "admin" },
        nickname: { equals: seat.mirrorFromNickname, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (source && membership.mirrorFromMembershipId !== source.id) {
      const current = membership.mirrorFromMembershipId;
      if (!current) {
        await db.membership.update({
          where: { id: membership.id },
          data: {
            pickBackup: "mirror",
            mirrorFromMembershipId: source.id,
          },
        });
        membership = {
          ...membership,
          pickBackup: "mirror",
          mirrorFromMembershipId: source.id,
        };
        result.mirrorSet = true;
      }
    }
  }

  const week1 = await db.week.findUnique({
    where: { poolId_number: { poolId, number: 1 } },
    include: { games: true },
  });
  if (week1) {
    const existingPick = await db.pick.findUnique({
      where: {
        membershipId_weekId: {
          membershipId: membership.id,
          weekId: week1.id,
        },
      },
    });
    const game = week1.games.find(
      (g) => g.awayAbbr === seat.week1Team || g.homeAbbr === seat.week1Team
    );
    const replaceMiss =
      existingPick &&
      (existingPick.source === "missed" || existingPick.teamAbbr === "MISS");
    const replaceCanonical =
      existingPick &&
      existingPick.teamAbbr !== seat.week1Team &&
      (existingPick.source === "imported" ||
        existingPick.source === "mirrored");
    if (game && (!existingPick || replaceMiss || replaceCanonical)) {
      if (existingPick && (replaceMiss || replaceCanonical)) {
        await db.pick.delete({ where: { id: existingPick.id } });
      }
      await db.pick.create({
        data: {
          membershipId: membership.id,
          weekId: week1.id,
          teamAbbr: seat.week1Team,
          gameId: game.id,
          source: "imported",
          result: "pending",
        },
      });
      const { rebuildUsedTeams } = await import("./grading");
      await rebuildUsedTeams(membership.id);
      result.importedWeek1 = true;
    }
  }

  if (
    result.createdMembership ||
    result.importedWeek1 ||
    result.mirrorSet ||
    result.convertedPendingEmail
  ) {
    await db.auditLog.create({
      data: {
        poolId,
        action: LIVE_ROSTER_SEAT_AUDIT,
        targetType: "membership",
        targetId: membership.id,
        details: JSON.stringify({
          ...result,
          realName: seat.realName,
          practiceEmail: isDemoEmail(seat.practiceEmail)
            ? seat.practiceEmail
            : "(practice)",
          week1Team: seat.week1Team,
          mirrorFromNickname: seat.mirrorFromNickname,
        }),
      },
    });
  }

  return result;
}

let lastEnsureAt = 0;
let inflight: Promise<EnsuredSeatResult[]> | null = null;

export async function ensureCanonicalLiveSeatsThrottled(
  db: PrismaClient,
  poolId: string
): Promise<EnsuredSeatResult[] | { skipped: true }> {
  if (Date.now() - lastEnsureAt < 60_000) return { skipped: true };
  if (inflight) return inflight;
  inflight = ensureCanonicalLiveSeats(db, poolId)
    .catch((error) => {
      console.warn("[live-roster] ensure skipped", error);
      return [] as EnsuredSeatResult[];
    })
    .finally(() => {
      inflight = null;
      lastEnsureAt = Date.now();
    });
  return inflight;
}
