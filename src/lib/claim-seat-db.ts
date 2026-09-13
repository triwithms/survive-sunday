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
import {
  normalizeAuthEmail,
  normalizeAuthPassword,
  passwordsMatch,
  shouldSkipClaimPassword,
} from "./auth-credentials";
import {
  ensureDualMembershipIndex,
  isMembershipUserUniqueError,
  isUserEmailUniqueError,
} from "./membership-schema";
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
  sessionEmail?: string;
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
    email:
      typeof input.email === "string" ? normalizeAuthEmail(input.email) : "",
    // Keep the pasted password intact (iOS often adds a trailing \n).
    // Attach compares via passwordsMatch(); new hashes use the normalized form.
    password: typeof input.password === "string" ? input.password : "",
    sessionUserId:
      typeof input.sessionUserId === "string" ? input.sessionUserId : "",
    sessionEmail:
      typeof input.sessionEmail === "string" ? input.sessionEmail : "",
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
  const normalized = normalizeAuthEmail(email);
  let user = await tx.user.findUnique({
    where: { email: normalized },
    select: { id: true, passwordHash: true },
  });
  if (!user && email.trim() !== normalized) {
    user = await tx.user.findUnique({
      where: { email: email.trim() },
      select: { id: true, passwordHash: true },
    });
  }
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
  sessionEmail?: string;
}): Promise<JoinOrClaimResult> {
  const seatPreview = await prisma.membership.findFirst({
    where: { id: args.membershipId, poolId: args.poolId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const ownerPreview = await ownerInfoForEmail(prisma, args.email, args.poolId);
  const previewDecision = decideClaim({
    seat: seatPreview
      ? {
          role: seatPreview.role,
          userId: seatPreview.userId,
          email: seatPreview.user.email,
        }
      : null,
    newEmail: args.email,
    emailOwner: ownerPreview,
  });
  if (!previewDecision.ok) return previewDecision;

  if (previewDecision.action === "attach-to-existing") {
    const signedInOwner = shouldSkipClaimPassword({
      sessionUserId: args.sessionUserId,
      sessionEmail: args.sessionEmail,
      ownerUserId: previewDecision.userId,
      claimEmail: args.email,
    });
    if (!signedInOwner) {
      const hash = ownerPreview?.passwordHash;
      const passwordOk = hash
        ? await passwordsMatch(args.password, hash)
        : false;
      if (!passwordOk) {
        return {
          ok: false,
          status: 401,
          error: CLAIM_ERRORS.emailPasswordMismatch,
        };
      }
    }
    // Neon may still have main's @@unique([poolId, userId]). Drop before write.
    await ensureDualMembershipIndex(prisma);
  }

  const writeClaim = () =>
    prisma.$transaction(async (tx) => {
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
              note: "Player role attached to existing user (also Administrator)",
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
          passwordHash: await bcrypt.hash(
            normalizeAuthPassword(args.password) || args.password,
            10
          ),
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

  try {
    return await writeClaim();
  } catch (err) {
    if (isMembershipUserUniqueError(err)) {
      console.error(
        "[claim] leftover Membership_poolId_userId unique — dropping and retrying",
        err
      );
      await ensureDualMembershipIndex(prisma);
      try {
        return await writeClaim();
      } catch (retryErr) {
        if (isMembershipUserUniqueError(retryErr)) {
          console.error(
            "[claim] Membership_poolId_userId unique still present after drop",
            retryErr
          );
          return {
            ok: false,
            status: 503,
            error: CLAIM_ERRORS.seatAttachBlocked,
          };
        }
        if (isUserEmailUniqueError(retryErr)) {
          return { ok: false, status: 409, error: CLAIM_ERRORS.emailTaken };
        }
        throw retryErr;
      }
    }
    if (isUserEmailUniqueError(err)) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.emailTaken };
    }
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("UNIQUE")) {
      if (isMembershipUserUniqueError(err)) {
        return {
          ok: false,
          status: 503,
          error: CLAIM_ERRORS.seatAttachBlocked,
        };
      }
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
        passwordHash: await bcrypt.hash(
          normalizeAuthPassword(args.password) || args.password,
          10
        ),
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
  const {
    inviteCode,
    email,
    password,
    membershipId,
    nickname,
    realName,
    sessionUserId,
    sessionEmail,
  } = normalizeJoinFields(input);

  if (!inviteCode || !email) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.missingFields };
  }
  const passwordNormalized = normalizeAuthPassword(password);
  if (!passwordNormalized && !sessionUserId) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.missingFields };
  }
  if (passwordNormalized && passwordNormalized.length < CLAIM_PASSWORD_MIN) {
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
    await ensureDualMembershipIndex(prisma);
    return claimPracticeSeat({
      poolId: pool.id,
      membershipId,
      email,
      password,
      sessionUserId: sessionUserId || undefined,
      sessionEmail: sessionEmail || undefined,
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
