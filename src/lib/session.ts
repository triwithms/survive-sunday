import { auth } from "./auth";
import { prisma } from "./db";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import { ensureLiveWeekIsolation } from "./week-isolation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function getMembershipForUser(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: {
      pool: true,
      user: true,
      picks: { include: { game: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (membership) {
    await applyCanonicalRosterNamesThrottled(prisma, membership.poolId);
    const isolation = await ensureLiveWeekIsolation(prisma, membership.pool);
    if (isolation.changed) {
      return prisma.membership.findFirst({
        where: { userId },
        include: {
          pool: true,
          user: true,
          picks: { include: { game: true } },
        },
        orderBy: { createdAt: "asc" },
      });
    }
  }
  return membership;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  const m = await getMembershipForUser(user.id);
  if (!m || m.role !== "admin") return null;
  return { user, membership: m };
}
