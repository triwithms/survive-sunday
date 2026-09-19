import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { maskEmail } from "./otp";
import {
  ADMIN_SET_PASSWORD_AUDIT,
  checkSetMemberPassword,
} from "./check-set-member-password";

export {
  ADMIN_SET_PASSWORD_AUDIT,
  checkSetMemberPassword,
  TEMP_PASSWORD_MAX,
  TEMP_PASSWORD_MIN,
  type SetMemberPasswordCheck,
  type SetMemberPasswordInput,
  type SetMemberPasswordMember,
} from "./check-set-member-password";

export async function setMemberTemporaryPassword(args: {
  db: PrismaClient;
  poolId: string;
  actorId: string;
  membershipId: string;
  confirmNickname: string;
  password: string;
}): Promise<
  | { ok: true; nickname: string; email: string; emailMasked: string }
  | { ok: false; error: string; status: number }
> {
  const member = await args.db.membership.findFirst({
    where: { id: args.membershipId, poolId: args.poolId },
    select: {
      id: true,
      nickname: true,
      role: true,
      userId: true,
      user: { select: { email: true } },
    },
  });
  const check = checkSetMemberPassword({
    membershipId: args.membershipId,
    confirmNickname: args.confirmNickname,
    password: args.password,
    member: member
      ? {
          id: member.id,
          nickname: member.nickname,
          role: member.role,
          email: member.user.email,
        }
      : null,
  });
  if (!check.ok) {
    const status = /not find/i.test(check.error) ? 404 : 400;
    return { ok: false, error: check.error, status };
  }

  const passwordHash = await bcrypt.hash(args.password, 10);
  await args.db.$transaction([
    args.db.user.update({
      where: { id: member!.userId },
      data: { passwordHash },
    }),
    args.db.auditLog.create({
      data: {
        poolId: args.poolId,
        actorId: args.actorId,
        action: ADMIN_SET_PASSWORD_AUDIT,
        targetType: "membership",
        targetId: member!.id,
        details: JSON.stringify({
          nickname: check.nickname,
          emailMasked: maskEmail(check.email),
          note: "Administrator set a password. The password itself is not stored here.",
        }),
      },
    }),
  ]);

  return {
    ok: true,
    nickname: check.nickname,
    email: check.email,
    emailMasked: maskEmail(check.email),
  };
}
