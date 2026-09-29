import "server-only";
import { prisma } from "./db";
import { hashPoolInvite, mintPoolInviteSecret, poolInvitePath } from "./pool-invite";
import { appOrigin, joinUrl } from "./add-user-prep";

export function isMissingPoolInviteTable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : "";
  return msg.includes("PoolInvite") && /does not exist|P2021/i.test(msg);
}

async function quiet<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isMissingPoolInviteTable(error)) throw error;
    return fallback;
  }
}

export async function poolInviteIsActive(poolId: string): Promise<boolean> {
  const row = await quiet(
    () =>
      prisma.poolInvite.findFirst({
        where: { poolId, revokedAt: null },
        select: { id: true },
      }),
    null
  );
  return Boolean(row);
}

/** Pool id comes from the stored hash. Unknown, revoked, or other pools are null. */
export async function peekPoolInvite(token: string) {
  const tokenHash = hashPoolInvite(token);
  return quiet(
    () =>
      prisma.poolInvite.findUnique({
        where: { tokenHash },
        select: {
          revokedAt: true,
          poolId: true,
          pool: { select: { name: true } },
        },
      }).then((row) => {
        if (!row || row.revokedAt) return null;
        return { poolId: row.poolId, name: row.pool.name };
      }),
    null
  );
}

export async function rotatePoolInvite(poolId: string) {
  const minted = mintPoolInviteSecret();
  await prisma.$transaction([
    prisma.poolInvite.updateMany({
      where: { poolId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.poolInvite.create({
      data: { poolId, tokenHash: minted.tokenHash },
    }),
  ]);
  return { url: joinUrl(appOrigin(), poolInvitePath(minted.token)) };
}

export async function revokePoolInvite(poolId: string) {
  await prisma.poolInvite.updateMany({
    where: { poolId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
