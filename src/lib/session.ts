import { cache } from "react";
import { cookies } from "next/headers";
import { auth } from "./auth";
import { ACTIVE_POOL_COOKIE, pickActivePoolId, poolChoicesFromMemberships } from "./active-pool";
import { INVITE_CODE } from "./constants";
import { deferAfter } from "./defer-after";
import { prisma } from "./db";
import { applyCanonicalRosterNamesThrottled } from "./roster-name-patch";
import { ensureCanonicalLiveSeatsThrottled } from "./live-roster";
import { ensureLiveWeekIsolation } from "./week-isolation";
import { hasRole, isAdministrator, isPlayerSeat, POOL_ROLES } from "./roles";
import { backfillPoolAccessRoles, listUserPoolRoles } from "./roles-db";
import { ensurePickMirrorColumn } from "./pick-mirror-schema";
import { ensurePoolRulesColumns } from "./pool-rules-schema";
import { ensureUserNotifyPref } from "./notify-pref-schema";

const membershipInclude = {
  pool: true,
  user: true,
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
  return /autoPickStamps|pickBackup|mirrorFromMembershipId|isParticipant|playingFromWeek|singleEliminationFromWeek|startWeek|notifyPref|masterOn|channelsJson|does not exist in the current database/i.test(
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
    await ensurePoolRulesColumns(prisma);
    await ensureUserNotifyPref(prisma);
    return prisma.membership.findMany({
      where: { userId },
      include: membershipInclude,
      orderBy: { createdAt: "asc" },
    });
  }
}

function schedulePoolMaintenance(poolId: string): void {
  deferAfter("pool maintenance", async () => {
    await applyCanonicalRosterNamesThrottled(prisma, poolId);
    await ensureCanonicalLiveSeatsThrottled(prisma, poolId);
  });
}

async function requestedActivePoolId(): Promise<string | null> {
  try {
    const jar = await cookies();
    return jar.get(ACTIVE_POOL_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * One login can be Player (board / picks) and Administrator (Admin tools).
 * `membership` is the player seat in the active pool when both exist.
 * Admin flags are for that pool only — never another pool's seat.
 * Family-pool maintenance runs only for SUNDAY26 so a new pool does not
 * receive the live roster.
 */
export const getUserPoolContext = cache(async (userId: string) => {
  let memberships = await loadMemberships(userId);
  const pools = poolChoicesFromMemberships(memberships);
  const activePoolId = pickActivePoolId(
    memberships,
    await requestedActivePoolId()
  );
  let activeMemberships = memberships.filter((row) => row.poolId === activePoolId);
  const activePool = activeMemberships[0]?.pool;
  if (activePool && activePool.inviteCode === INVITE_CODE) {
    const isolation = await ensureLiveWeekIsolation(prisma, activePool);
    if (isolation.changed) {
      memberships = await loadMemberships(userId);
      activeMemberships = memberships.filter((row) => row.poolId === activePoolId);
    }
    schedulePoolMaintenance(activePool.id);
  }
  const membership = preferPlayerMembership(activeMemberships);
  const adminMembership = adminMembershipOf(activeMemberships);
  const poolId = activePoolId;
  let roles: string[] = [];
  if (poolId) {
    roles = await listUserPoolRoles(prisma, { poolId, userId });
    if (roles.length === 0 && activeMemberships.length > 0) {
      await backfillPoolAccessRoles(prisma, poolId);
      roles = await listUserPoolRoles(prisma, { poolId, userId });
    }
  }
  const isPlayer =
    hasRole(roles, POOL_ROLES.player) ||
    Boolean(membership && isPlayerSeat(membership));
  const isAdmin =
    hasRole(roles, POOL_ROLES.administrator) ||
    activeMemberships.some((m) => isAdministrator(m));
  return {
    membership,
    adminMembership,
    isAdmin,
    isPlayer,
    roles,
    memberships: activeMemberships,
    pools,
    activePoolId,
  };
});

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
