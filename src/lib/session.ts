import { auth } from "./auth";
import { prisma } from "./db";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import { ensureCanonicalLiveSeatsThrottled } from "./live-roster";
import { ensureLiveWeekIsolation } from "./week-isolation";
import { hasRole, isAdministrator, isPlayerSeat, POOL_ROLES } from "./roles";
import { backfillPoolAccessRoles, listUserPoolRoles } from "./roles-db";
import { ensurePickMirrorColumn } from "./pick-mirror-schema";

const membershipInclude = {
  pool: true,
  user: true,
  picks: { include: { game: true } },
} as const;

export function preferPlayerMembership<T extends { role: string }>(
  memberships: T[]
): T | null {
  if (!memberships.length) return null;
  return memberships.find((m) => isPlayerSeat(m)) ?? memberships[0] ?? null;
}

export function adminMembershipOf<T extends { role: string; isAdmin?: boolean }>(
  memberships: T[]
): T | null {
  return (
    memberships.find((m) => m.role === "admin") ??
    memberships.find((m) => isAdministrator(m)) ??
    null
  );
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

function isMissingMembershipColumn(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2022") return true;
  }
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /autoPickStamps|pickBackup|mirrorFromMembershipId|isParticipant|playingFromWeek|singleEliminationFromWeek|does not exist in the current database/i.test(
    msg
  );
}

async function loadMemberships(userId: string) {
  try {
    return await prisma.membership.findMany({
      where: { userId },
      include: membershipInclude,
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    if (!isMissingMembershipColumn(error)) throw error;
    await ensurePickMirrorColumn(prisma);
    return prisma.membership.findMany({
      where: { userId },
      include: membershipInclude,
      orderBy: { createdAt: "asc" },
    });
  }
}

/**
 * One login can be Player (board / picks) and Administrator (Admin tools).
 * `membership` is the player seat when both exist (e.g. Gams).
 */
export async function getUserPoolContext(userId: string) {
  let memberships = await loadMemberships(userId);
  if (memberships[0]) {
    await applyCanonicalRosterNamesThrottled(prisma, memberships[0].poolId);
    await ensureCanonicalLiveSeatsThrottled(prisma, memberships[0].poolId);
    const isolation = await ensureLiveWeekIsolation(prisma, memberships[0].pool);
    if (isolation.changed) {
      memberships = await loadMemberships(userId);
    }
  }
  const membership = preferPlayerMembership(memberships);
  const adminMembership = adminMembershipOf(memberships);
  const poolId = memberships[0]?.poolId;
  let roles: string[] = [];
  if (poolId) {
    roles = await listUserPoolRoles(prisma, { poolId, userId });
    if (roles.length === 0) {
      await backfillPoolAccessRoles(prisma, poolId);
      roles = await listUserPoolRoles(prisma, { poolId, userId });
    }
  }
  const isPlayer =
    hasRole(roles, POOL_ROLES.player) ||
    Boolean(membership && isPlayerSeat(membership));
  const isAdmin =
    hasRole(roles, POOL_ROLES.administrator) ||
    memberships.some((m) => isAdministrator(m));
  return {
    membership,
    adminMembership,
    isAdmin,
    isPlayer,
    roles,
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
  if (!ctx.isAdmin || !ctx.membership) return null;
  return { user, membership: ctx.adminMembership ?? ctx.membership };
}
