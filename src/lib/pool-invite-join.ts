import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { normalizeAuthPassword, passwordsMatch } from "./auth-credentials";
import { uniqueAddUserNick } from "./add-user-prep";
import { uniqueContactFail } from "./contact-taken";
import { effectiveCurrentWeek } from "./pool-mode";
import { isWeekLocked } from "./grading";
import { nextPlayingWeek } from "./pool-rules";
import { grantPoolRole } from "./roles-db";
import { POOL_ROLES } from "./roles";
import { parsePoolJoin } from "./pool-invite";
import { peekPoolInvite } from "./pool-invite-db";

const ALREADY =
  "You are already in this pool. Sign in with your email and password.";
const KEEP_PASSWORD =
  "That email already has a password. Sign in, or use Forgot password. This link will not change it.";

async function playingStart(poolId: string): Promise<number | null> {
  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: poolId },
    select: { mode: true, currentWeek: true, slatePoolId: true },
  });
  const currentWeek = effectiveCurrentWeek(pool.mode, pool.currentWeek);
  const week = await prisma.week.findUnique({
    where: { poolId_number: { poolId, number: currentWeek } },
    select: { lockAt: true, lockOverrideAt: true },
  });
  const locked = week ? isWeekLocked(week) : false;
  if (locked) return nextPlayingWeek({ currentWeek, weekLocked: true });
  return pool.slatePoolId ? currentWeek : null;
}

export async function joinViaPoolInvite(body: unknown) {
  const parsed = parsePoolJoin(body);
  if (!parsed.ok) return parsed;
  const invite = await peekPoolInvite(parsed.value.token);
  if (!invite) {
    return { ok: false as const, status: 400, error: "This join link is off or not valid." };
  }
  const poolId = invite.poolId;
  const { email, nickname: wanted } = parsed.value;
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  if (existing) {
    const taken = await prisma.membership.findFirst({
      where: { poolId, userId: existing.id, role: { not: "admin" } },
      select: { id: true },
    });
    if (taken) return { ok: false as const, status: 409, error: ALREADY };
    const matches = existing.passwordHash
      ? await passwordsMatch(parsed.value.password, existing.passwordHash)
      : false;
    if (!matches) return { ok: false as const, status: 401, error: KEEP_PASSWORD };
  }
  const nickname = await uniqueAddUserNick(poolId, wanted);
  const playingFromWeek = await playingStart(poolId);
  const password = normalizeAuthPassword(parsed.value.password);
  try {
    const membershipId = await prisma.$transaction(async (tx) => {
      const userId = existing
        ? existing.id
        : (
            await tx.user.create({
              data: {
                email,
                name: nickname,
                passwordHash: await bcrypt.hash(password, 10),
                notifyPref: "email",
              },
              select: { id: true },
            })
          ).id;
      const membership = await tx.membership.create({
        data: {
          poolId,
          userId,
          nickname,
          role: "member",
          isParticipant: true,
          playingFromWeek,
        },
        select: { id: true },
      });
      await grantPoolRole(tx, { poolId, userId, role: POOL_ROLES.player });
      await tx.auditLog.create({
        data: {
          poolId,
          actorId: userId,
          action: "pool_invite_join",
          targetType: "membership",
          targetId: membership.id,
          details: JSON.stringify({ nickname }),
        },
      });
      return membership.id;
    });
    return { ok: true as const, email, poolId, membershipId };
  } catch (err) {
    const fail = uniqueContactFail(err);
    if (fail) return { ok: false as const, ...fail };
    throw err;
  }
}
