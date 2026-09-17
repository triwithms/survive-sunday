import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { collectAdminEmails, resetAdminUserIds } from "./password-reset-notify";

export async function loadResetNotifyContext(
  userId: string,
  email: string
): Promise<{ who: string; adminEmails: string[] }> {
  const pool = await prisma.pool.findUnique({
    where: { inviteCode: INVITE_CODE },
    select: { id: true },
  });
  if (!pool) return { who: email, adminEmails: [] };

  const members = await prisma.membership.findMany({
    where: { poolId: pool.id },
    select: { userId: true, role: true, isAdmin: true, nickname: true },
  });
  const grants = await prisma.poolAccessRole.findMany({
    where: { poolId: pool.id },
    select: { userId: true, role: true },
  });
  const adminIds = resetAdminUserIds(members, grants);
  const who =
    members.find((m) => m.userId === userId)?.nickname?.trim() || email;
  if (adminIds.length === 0) return { who, adminEmails: [] };

  const users = await prisma.user.findMany({
    where: { id: { in: adminIds } },
    select: { email: true },
  });
  return { who, adminEmails: collectAdminEmails(users) };
}
