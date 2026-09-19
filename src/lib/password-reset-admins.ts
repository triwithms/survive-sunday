import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { resetAdminUserIds } from "./password-reset-notify";

export type AdminNotifyUser = {
  id: string;
  email: string | null;
  phoneE164: string | null;
  notifyPref: string;
};

/** Same multi-admin union as password-reset notify. */
export async function loadPoolAdminUsers(
  poolId: string
): Promise<AdminNotifyUser[]> {
  const members = await prisma.membership.findMany({
    where: { poolId },
    select: { userId: true, role: true, isAdmin: true },
  });
  const grants = await prisma.poolAccessRole.findMany({
    where: { poolId },
    select: { userId: true, role: true },
  });
  const adminIds = resetAdminUserIds(members, grants);
  if (adminIds.length === 0) return [];
  return prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { id: true, email: true, phoneE164: true, notifyPref: true },
  });
}

export async function loadResetNotifyContext(
  userId: string,
  email: string
): Promise<{ who: string; admins: AdminNotifyUser[] }> {
  const pool = await prisma.pool.findUnique({
    where: { inviteCode: INVITE_CODE },
    select: { id: true },
  });
  if (!pool) return { who: email, admins: [] };

  const members = await prisma.membership.findMany({
    where: { poolId: pool.id },
    select: { userId: true, role: true, isAdmin: true, nickname: true },
  });
  const who =
    members.find((m) => m.userId === userId)?.nickname?.trim() || email;
  const admins = await loadPoolAdminUsers(pool.id);
  return { who, admins };
}
