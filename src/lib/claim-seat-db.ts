import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { getPrimaryPool } from "./pool-mode-db";
import { isDemoEmail } from "./pool-mode";
import {
  CLAIM_ERRORS,
  CLAIM_PASSWORD_MIN,
  decideClaim,
  seatsFromMemberships,
  type ClaimableSeat,
} from "./claim-seat";

export async function listClaimableSeats(): Promise<ClaimableSeat[]> {
  const pool = await getPrimaryPool();
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

async function claimPracticeSeat(args: {
  poolId: string;
  membershipId: string;
  email: string;
  password: string;
}): Promise<JoinOrClaimResult> {
  const passwordHash = await bcrypt.hash(args.password, 10);

  try {
    const claimed = await prisma.$transaction(async (tx) => {
      const seat = await tx.membership.findFirst({
        where: { id: args.membershipId, poolId: args.poolId },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      const emailOwner = await tx.user.findUnique({
        where: { email: args.email },
        select: { id: true },
      });

      const decision = decideClaim({
        seat: seat
          ? { role: seat.role, userId: seat.userId, email: seat.user.email }
          : null,
        newEmail: args.email,
        emailOwner,
      });
      if (!decision.ok) return decision;

      const displayName = seat!.realName || seat!.nickname || args.email;
      await tx.user.update({
        where: { id: decision.userId },
        data: {
          email: args.email,
          passwordHash,
          name: seat!.user.name && !isDemoEmail(seat!.user.email)
            ? seat!.user.name
            : displayName,
        },
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
    const existing = await prisma.membership.findUnique({
      where: { poolId_userId: { poolId: args.poolId, userId: user.id } },
    });
    if (existing) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.alreadyInPool };
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

  const pool = await getPrimaryPool();
  if (!pool) {
    return { ok: false, status: 404, error: CLAIM_ERRORS.poolMissing };
  }

  if (membershipId) {
    return claimPracticeSeat({
      poolId: pool.id,
      membershipId,
      email,
      password,
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
