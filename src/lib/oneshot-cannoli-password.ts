import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { isSeatClaimed } from "./claim-seat";
import { INVITE_CODE } from "./constants";
import { nicknamesMatch } from "./pool-rules";
import { isPlayerSeat } from "./roles";
import { maskEmail } from "./otp";
import { setMemberTemporaryPassword } from "./admin-set-password";

/** One-shot marker so later deploys do not reset Mike again. */
export const CANNOLI_ONESHOT_AUDIT = "oneshot_cannoli_temp_password_20260914";
export const CANNOLI_NICKNAME = "Cannoli Stuffer";
/** Temporary password Robert can text. Mike should change it after sign-in. */
export const CANNOLI_TEMP_PASSWORD = "Cannoli1!";

export type CannoliOneshotResult =
  | { status: "applied"; email: string; userId: string; membershipId: string }
  | { status: "already" }
  | { status: "skipped"; reason: string };

/**
 * Production build helper: write a known temporary password for the claimed
 * Cannoli Stuffer seat. Idempotent. Does not fail the whole deploy.
 */
export async function applyCannoliTempPasswordOneshot(
  db: PrismaClient
): Promise<CannoliOneshotResult> {
  const already = await db.auditLog.findFirst({
    where: { action: CANNOLI_ONESHOT_AUDIT },
    select: { id: true },
  });
  if (already) return { status: "already" };

  const pool = await db.pool.findUnique({
    where: { inviteCode: INVITE_CODE },
    select: { id: true },
  });
  if (!pool) return { status: "skipped", reason: "pool-missing" };

  const members = await db.membership.findMany({
    where: { poolId: pool.id },
    include: { user: { select: { id: true, email: true } } },
  });
  const target = members.find((m) => nicknamesMatch(m.nickname, CANNOLI_NICKNAME));
  if (!target) return { status: "skipped", reason: "nickname-missing" };
  if (!isPlayerSeat(target)) {
    return { status: "skipped", reason: "not-player" };
  }
  if (!isSeatClaimed(target.user.email)) {
    return { status: "skipped", reason: "not-claimed" };
  }

  const actor =
    members.find((m) => m.role === "admin")?.userId ?? target.userId;

  const set = await setMemberTemporaryPassword({
    db,
    poolId: pool.id,
    actorId: actor,
    membershipId: target.id,
    confirmNickname: CANNOLI_NICKNAME,
    password: CANNOLI_TEMP_PASSWORD,
  });
  if (!set.ok) {
    return { status: "skipped", reason: set.error };
  }

  const row = await db.user.findUnique({
    where: { id: target.user.id },
    select: { passwordHash: true, email: true },
  });
  if (!row?.passwordHash) {
    return { status: "skipped", reason: "hash-missing-after-write" };
  }
  const matches = await bcrypt.compare(CANNOLI_TEMP_PASSWORD, row.passwordHash);
  if (!matches) {
    return { status: "skipped", reason: "hash-mismatch-after-write" };
  }

  await db.auditLog.create({
    data: {
      poolId: pool.id,
      actorId: actor,
      action: CANNOLI_ONESHOT_AUDIT,
      targetType: "membership",
      targetId: target.id,
      details: JSON.stringify({
        nickname: CANNOLI_NICKNAME,
        emailMasked: maskEmail(row.email),
        note: "One-shot temp password for Mike Frigo. Password not stored here.",
      }),
    },
  });

  return {
    status: "applied",
    email: row.email,
    userId: target.user.id,
    membershipId: target.id,
  };
}
