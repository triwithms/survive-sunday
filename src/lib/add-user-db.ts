import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { AddUserValue } from "./add-user";
import { grantPoolRole } from "./roles-db";
import { POOL_ROLES } from "./roles";
import { createHashedInviteToken } from "./invite-token-db";
import { inviteJoinPath } from "./invite-token";
import { isWeekLocked } from "./grading";
import { effectiveCurrentWeek } from "./pool-mode";
import { nextPlayingWeek } from "./pool-rules";
import {
  appOrigin,
  createdUserRow,
  emailHasPlayerSeat,
  joinUrl,
  resolveAddUserEmail,
  resolveAddUserPassword,
  uniqueAddUserFail,
  uniqueAddUserNick,
  type AddUserResult,
  type AdminCtx,
} from "./add-user-prep";

export async function createAddUser(
  admin: AdminCtx,
  value: AddUserValue
): Promise<AddUserResult> {
  const pool = await prisma.pool.findUniqueOrThrow({
    where: { id: admin.membership.poolId },
    select: { id: true, mode: true, currentWeek: true },
  });
  const nickname = await uniqueAddUserNick(pool.id, value.nickname);
  const email = resolveAddUserEmail(value, nickname);
  const found = await emailHasPlayerSeat(pool.id, email);
  if (found.taken) {
    return { ok: false, error: "That email already has an account", status: 409 };
  }
  const passwordPlain = resolveAddUserPassword(value, email);
  const passwordHash = passwordPlain ? await bcrypt.hash(passwordPlain, 10) : undefined;
  const currentWeek = effectiveCurrentWeek(pool.mode, pool.currentWeek);
  const week = await prisma.week.findUnique({
    where: { poolId_number: { poolId: pool.id, number: currentWeek } },
    select: { lockAt: true, lockOverrideAt: true },
  });
  const locked = week ? isWeekLocked(week) : false;
  const playingFromWeek = locked ? nextPlayingWeek({ currentWeek, weekLocked: locked }) : null;
  try {
    const createData = {
      email,
      name: value.realName || nickname,
      phoneE164: value.phoneE164,
      passwordHash,
    };
    const user = found.existing
      ? await prisma.user.update({
          where: { id: found.existing.id },
          data: {
            ...(passwordHash ? { passwordHash } : {}),
            ...(value.phoneE164 ? { phoneE164: value.phoneE164, phoneSkippedAt: null } : {}),
            ...(value.realName ? { name: value.realName } : {}),
          },
        })
      : await prisma.user.create({ data: createData });
    const membership = await prisma.membership.create({
      data: {
        poolId: pool.id,
        userId: user.id,
        nickname,
        realName: value.realName,
        role: "member",
        playingFromWeek,
      },
    });
    await grantPoolRole(prisma, { poolId: pool.id, userId: user.id, role: POOL_ROLES.player });
    const minted = value.invite ? await createHashedInviteToken(membership.id) : null;
    const inviteUrl = minted ? joinUrl(appOrigin(), inviteJoinPath(minted.token)) : null;
    await prisma.auditLog.create({
      data: {
        poolId: pool.id,
        actorId: admin.user.id,
        action: "add_user",
        targetType: "membership",
        targetId: membership.id,
        details: JSON.stringify({ nickname, invite: Boolean(inviteUrl) }),
      },
    });
    return {
      ok: true,
      membership: createdUserRow(
        membership.id, nickname, value, email, passwordPlain, inviteUrl
      ),
    };
  } catch (err) {
    const fail = uniqueAddUserFail(err);
    if (fail) return fail;
    throw err;
  }
}
