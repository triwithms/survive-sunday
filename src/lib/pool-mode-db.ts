import "server-only";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { isDemoEmail, normalizePoolMode, type PoolMode } from "./pool-mode";

export async function getPrimaryPool() {
  return prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
}

export async function poolHasRealCommissioner(poolId: string): Promise<boolean> {
  const admins = await prisma.membership.findMany({
    where: { poolId, role: "admin" },
    include: { user: { select: { email: true } } },
  });
  return admins.some((a) => !isDemoEmail(a.user.email));
}

export async function getPrimaryPoolMode(): Promise<PoolMode> {
  try {
    const pool = await getPrimaryPool();
    return normalizePoolMode(pool?.mode);
  } catch (error) {
    console.error("[pool-mode] lookup failed — defaulting to demo", error);
    return "demo";
  }
}
