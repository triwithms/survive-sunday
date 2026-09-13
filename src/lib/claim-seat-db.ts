import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { isDemoEmail } from "./pool-mode";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import {
  CLAIM_ERRORS,
  CLAIM_PASSWORD_MIN,
  decideClaim,
  seatsFromMemberships,
  type ClaimableSeat,
} from "./claim-seat";
import { POOL_ROLES } from "./roles";
import { grantPoolRole } from "./roles-db";

async function primaryPool() {
  const pool = await prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (pool) {
    await applyCanonicalRosterNamesThrottled(prisma, pool.id);
  }
  return pool;
}

export async function listClaimableSeats(): Promise<ClaimableSeat[]> {
  const pool = await primaryPool();
  if (!pool) return [];

  const members = await prisma.membership.findMany({
    where: { poolId: pool.id },
    select: {
      id: true,
      nickname: true,
      realName: true,
      role: true,
      user: { select: { email: true } },
    },
    orderBy: { nickname: "asc" },
  });

  return seatsFromMemberships(members);
}

export type JoinOrClaimInput = {
  inviteCode: string;
  email: string;
  password: string;
  membershipId?: string;
  nickname?: string;
  realName?: string;
  /** Signed-in user claiming their own player seat (skip password re-check). */
  sessionUserId?: string;
};

export type JoinOrClaimResult =
  | {
      ok: true;
      membershipId: string;
      email: string;
      claimed: boolean;
    }
  | { ok: false; status: number; error: string };

function normalizeJoinFields(input: JoinOrClaimInput) {
  return {
    inviteCode: typeof input.inviteCode === "string" ? input.inviteCode.trim() : "",
    email: typeof input.email === "string" ? input.email.trim().toLowerCase() : "",
    password: typeof input.password === "string" ? input.password : "",
    membershipId:
      typeof input.membershipId === "string" ? input.membershipId.trim() : "",
    nickname: typeof input.nickname === "string" ? input.nickname.trim() : "",
    realName: typeof input.realName === "string" ? input.realName.trim() : "",
  };
}

async function ownerInfoForEmail(
  tx: {
    user: { findUnique: typeof prisma.user.findUnique };
    membership: { findMany: typeof prisma.membership.findMany };
    poolAccessRole: { findMany: typeof prisma.poolAccessRole.findMany };
  },
  email: string,
  poolId: string
) {
  const user = await tx.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  if (!user) return null;
  const seats = await tx.membership.findMany({
    where: { poolId, userId: user.id },
    select: { role: true, isAdmin: true },
  });
  const grants = await tx.poolAccessRole.findMany({
    where: { poolId, userId: user.id },
    select: { role: true },
  });
  return {
    id: user.id,
    passwordHash: user.passwordHash,
    hasPlayerSeat:
      seats.some((s) => s.role !== "admin") ||
      grants.some((g) => g.role === POOL_ROLES.player),
    hasAdminSeat:
      seats.some((s) => s.role === "admin" || s.isAdmin) ||
      grants.some((g) => g.role === POOL_ROLES.administrator),
  };
}

async function claimPracticeSeat(args: {
  poolId: string;
  membershipId: string;
  email: string;
  password: string;
  sessionUserId?: string;
}): Promise<JoinOrClaimResult> {
  try {
    const claimed = await prisma.$transaction(async (tx) => {
      const seat = await tx.membership.findFirst({
        where: { id: args.membershipId, poolId: args.poolId },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      const emailOwner = await ownerInfoForEmail(tx, args.email, args.poolId);

      const decision = decideClaim({
        seat: seat
          ? { role: seat.role, userId: seat.userId, email: seat.user.email }
          : null,
        newEmail: args.email,
        emailOwner,
      });
      if (!decision.ok) return decision;

      if (decision.action === "attach-to-existing") {
        const signedInOwner =
          Boolean(args.sessionUserId) && args.sessionUserId === decision.userId;
        if (!signedInOwner) {
          const hash = emailOwner?.passwordHash;
          const passwordOk = hash
            ? await bcrypt.compare(args.password, hash)
            : false;
          if (!passwordOk) {
            return {
              ok: false as const,
              status: 401,
              error: CLAIM_ERRORS.emailPasswordMismatch,
            };
          }
        }

        const oldUserId = seat!.userId;
        await tx.membership.update({
          where: { id: seat!.id },
          data: {
            userId: decision.userId,
            isAdmin: Boolean(emailOwner?.hasAdminSeat),
          },
        });
        await grantPoolRole(tx, {
          poolId: args.poolId,
          userId: decision.userId,
          role: POOL_ROLES.player,
        });
        if (emailOwner?.hasAdminSeat) {
          await grantPoolRole(tx, {
            poolId: args.poolId,
            userId: decision.userId,
            role: POOL_ROLES.administrator,
          });
        }
        if (oldUserId !== decision.userId) {
          const leftover = await tx.membership.count({
            where: { userId: oldUserId },
          });
          if (leftover === 0) {
            await tx.user.delete({ where: { id: oldUserId } });
          }
        }

        await tx.auditLog.create({
          data: {
            poolId: args.poolId,
            actorId: decision.userId,
            action: "claim_seat",
            targetType: "membership",
            targetId: seat!.id,
            details: JSON.stringify({
              nickname: seat!.nickname,
              from: seat!.user.email,
              to: args.email,
              note: "Player seat attached to existing commissioner login",
            }),
          },
        });

        return {
          ok: true as const,
          membershipId: seat!.id,
          email: args.email,
          claimed: true as const,
        };
      }

      const displayName = seat!.realName || seat!.nickname || args.email;
      await tx.user.update({
        where: { id: decision.userId },
        data: {
          email: args.email,
          passwordHash: await bcrypt.hash(args.password, 10),
          name:
            seat!.user.name && !isDemoEmail(seat!.user.email)
              ? seat!.user.name
              : displayName,
        },
      });

      await grantPoolRole(tx, {
        poolId: args.poolId,
        userId: decision.userId,
        role: POOL_ROLES.player,
      });

      await tx.auditLog.create({
        data: {
          poolId: args.poolId,
          actorId: decision.userId,
          action: "claim_seat",
          targetType: "membership",
          targetId: seat!.id,
          details: JSON.stringify({
            nickname: seat!.nickname,
            from: seat!.user.email,
            to: args.email,
            note: "Practice seat claimed with a real email and password",
          }),
        },
      });

      return {
        ok: true as const,
        membershipId: seat!.id,
        email: args.email,
        claimed: true as const,
      };
    });

    return claimed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("UNIQUE")) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.emailTaken };
    }
    throw err;
  }
}

async function joinAsNewPlayer(args: {
  poolId: string;
  email: string;
  password: string;
  nickname: string;
  realName: string;
}): Promise<JoinOrClaimResult> {
  const existingNick = await prisma.membership.findUnique({
    where: { poolId_nickname: { poolId: args.poolId, nickname: args.nickname } },
  });
  if (existingNick) {
    return { ok: false, status: 409, error: CLAIM_ERRORS.nicknameTaken };
  }

  let user = await prisma.user.findUnique({ where: { email: args.email } });
  if (user) {
    const existing = await prisma.membership.findMany({
      where: { poolId: args.poolId, userId: user.id },
      select: { role: true, isAdmin: true },
    });
    const grants = await prisma.poolAccessRole.findMany({
      where: { poolId: args.poolId, userId: user.id },
      select: { role: true },
    });
    if (
      existing.some((s) => s.role !== "admin") ||
      grants.some((g) => g.role === POOL_ROLES.player)
    ) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.alreadyInPool };
    }
    if (
      existing.some((s) => s.role === "admin" || s.isAdmin) ||
      grants.some((g) => g.role === POOL_ROLES.administrator)
    ) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.alreadyCommissioner };
    }
  } else {
    user = await prisma.user.create({
      data: {
        email: args.email,
        name: args.realName || args.nickname,
        passwordHash: await bcrypt.hash(args.password, 10),
      },
    });
  }

  const membership = await prisma.membership.create({
    data: {
      poolId: args.poolId,
      userId: user.id,
      nickname: args.nickname,
      realName: args.realName || null,
      role: "member",
    },
  });
  await grantPoolRole(prisma, {
    poolId: args.poolId,
    userId: user.id,
    role: POOL_ROLES.player,
  });

  return {
    ok: true,
    membershipId: membership.id,
    email: args.email,
    claimed: false,
  };
}

export async function joinOrClaimSeat(
  input: JoinOrClaimInput
): Promise<JoinOrClaimResult> {
  const { inviteCode, email, password, membershipId, nickname, realName } =
    normalizeJoinFields(input);

  if (!inviteCode || !email || !password) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.missingFields };
  }
  if (password.length < CLAIM_PASSWORD_MIN) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.passwordShort };
  }
  if (inviteCode.toUpperCase() !== INVITE_CODE) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.invalidInvite };
  }
  if (isDemoEmail(email)) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.demoEmail };
  }
  if (!membershipId && !nickname) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.missingFields };
  }

  const pool = await primaryPool();
  if (!pool) {
    return { ok: false, status: 404, error: CLAIM_ERRORS.poolMissing };
  }

  if (membershipId) {
    return claimPracticeSeat({
      poolId: pool.id,
      membershipId,
      email,
      password,
      sessionUserId: input.sessionUserId,
    });
  }

  return joinAsNewPlayer({
    poolId: pool.id,
    email,
    password,
    nickname,
    realName,
  });
}
