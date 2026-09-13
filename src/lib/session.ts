import { auth } from "./auth";
import { prisma } from "./db";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import { ensureLiveWeekIsolation } from "./week-isolation";

const membershipInclude = {
  pool: true,
  user: true,
  picks: { include: { game: true } },
} as const;

export function preferPlayerMembership<T extends { role: string }>(
  memberships: T[]
): T | null {
  if (!memberships.length) return null;
  return memberships.find((m) => m.role !== "admin") ?? memberships[0] ?? null;
}

export function adminMembershipOf<T extends { role: string }>(
  memberships: T[]
): T | null {
  return memberships.find((m) => m.role === "admin") ?? null;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

async function loadMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: membershipInclude,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * One login can hold the commissioner spectator seat and a player seat.
 * `membership` is the player seat when both exist (Gams picks / board).
 */
export async function getUserPoolContext(userId: string) {
  let memberships = await loadMemberships(userId);
  if (memberships[0]) {
    await applyCanonicalRosterNamesThrottled(prisma, memberships[0].poolId);
    const isolation = await ensureLiveWeekIsolation(prisma, memberships[0].pool);
    if (isolation.changed) {
      memberships = await loadMemberships(userId);
    }
  }
  return {
    membership: preferPlayerMembership(memberships),
    adminMembership: adminMembershipOf(memberships),
    isAdmin: Boolean(adminMembershipOf(memberships)),
    memberships,
  };
}

export async function getMembershipForUser(userId: string) {
  const ctx = await getUserPoolContext(userId);
  return ctx.membership;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user) return null;
  const ctx = await getUserPoolContext(user.id);
  if (!ctx.adminMembership) return null;
  return { user, membership: ctx.adminMembership };
}
