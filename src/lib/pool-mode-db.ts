import "server-only";
import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { isDemoEmail, normalizePoolMode, type PoolMode } from "./pool-mode";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import { ensureLiveWeekIsolation } from "./week-isolation";

export async function getPrimaryPool() {
  const pool = await prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (pool) {
    await applyCanonicalRosterNamesThrottled(prisma, pool.id);
    const isolation = await ensureLiveWeekIsolation(prisma, pool);
    if (isolation.changed) {
      return prisma.pool.findUnique({ where: { inviteCode: INVITE_CODE } });
    }
  }
  return pool;
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
    console.error("[pool-mode] lookup failed — defaulting to live", error);
    return "live";
  }
}
