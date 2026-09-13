/**
 * One User (one email/login). Roles are grants, not account types.
 * Shipped: Player, Administrator. Reserved: Watcher.
 * A user may hold several roles and switch views (Playing as … | Admin tools).
 */
export type RoleView = "player" | "admin";

export const ROLE_VIEW_COOKIE = "ss-role-view";

/** Shipped + reserved pool roles. Add a value here when a new role ships. */
export const POOL_ROLES = {
  player: "player",
  administrator: "administrator",
  /** Reserved: follow board + chat later. No picks / no buy-in. Not in UI yet. */
  watcher: "watcher",
} as const;

export type PoolRoleName = (typeof POOL_ROLES)[keyof typeof POOL_ROLES];

export const SHIPPED_POOL_ROLES = [
  POOL_ROLES.player,
  POOL_ROLES.administrator,
] as const;

export const RESERVED_POOL_ROLES = [POOL_ROLES.watcher] as const;

export function isKnownPoolRole(value: string): value is PoolRoleName {
  return (
    value === POOL_ROLES.player ||
    value === POOL_ROLES.administrator ||
    value === POOL_ROLES.watcher
  );
}

export function isShippedPoolRole(value: string): boolean {
  return (
    value === POOL_ROLES.player || value === POOL_ROLES.administrator
  );
}

export function hasRole(
  roles: readonly string[] | null | undefined,
  role: PoolRoleName
): boolean {
  return Boolean(roles?.includes(role));
}

export type RoleFlags = {
  role: string;
  isAdmin?: boolean | null;
  userId?: string;
};

export type RoleGrant = {
  userId: string;
  role: string;
};

/** Membership.role is the seat kind: player board vs commissioner spectator. */
export function isPlayerSeat(member: RoleFlags): boolean {
  return member.role !== "admin";
}

/** Legacy seat flag. Prefer hasRole(roles, administrator) when grants exist. */
export function isAdministrator(member: RoleFlags): boolean {
  return member.role === "admin" || Boolean(member.isAdmin);
}

export function uniqueUsersWithRole(
  grants: RoleGrant[],
  role: PoolRoleName
): string[] {
  const ids = new Set<string>();
  for (const grant of grants) {
    if (grant.role === role && grant.userId) ids.add(grant.userId);
  }
  return [...ids];
}

export function uniqueAdminUserIds(
  members: RoleFlags[],
  grants?: RoleGrant[]
): string[] {
  if (grants && grants.length > 0) {
    return uniqueUsersWithRole(grants, POOL_ROLES.administrator);
  }
  const ids = new Set<string>();
  for (const member of members) {
    if (isAdministrator(member) && member.userId) ids.add(member.userId);
  }
  return [...ids];
}

/** False if removing this user would leave the pool with no administrator. */
export function canDemoteAdmin(
  members: RoleFlags[],
  targetUserId: string,
  grants?: RoleGrant[]
): boolean {
  const admins = uniqueAdminUserIds(members, grants);
  if (!admins.includes(targetUserId)) return false;
  return admins.length > 1;
}

export function resolveRoleView(args: {
  isPlayer?: boolean;
  isAdmin?: boolean;
  roles?: readonly string[] | null;
  requested: string | null | undefined;
}): RoleView {
  const isPlayer =
    args.isPlayer ?? hasRole(args.roles, POOL_ROLES.player);
  const isAdmin =
    args.isAdmin ?? hasRole(args.roles, POOL_ROLES.administrator);
  if (isAdmin && isPlayer) {
    return args.requested === "admin" ? "admin" : "player";
  }
  if (isAdmin) return "admin";
  return "player";
}
