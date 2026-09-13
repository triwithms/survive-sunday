export type RoleView = "player" | "admin";

export const ROLE_VIEW_COOKIE = "ss-role-view";

export type RoleFlags = {
  role: string;
  isAdmin?: boolean | null;
  userId?: string;
};

export function isPlayerSeat(member: RoleFlags): boolean {
  return member.role !== "admin";
}

export function isAdministrator(member: RoleFlags): boolean {
  return member.role === "admin" || Boolean(member.isAdmin);
}

export function uniqueAdminUserIds(members: RoleFlags[]): string[] {
  const ids = new Set<string>();
  for (const member of members) {
    if (isAdministrator(member) && member.userId) ids.add(member.userId);
  }
  return [...ids];
}

/** False if removing this user would leave the pool with no administrator. */
export function canDemoteAdmin(
  members: RoleFlags[],
  targetUserId: string
): boolean {
  const admins = uniqueAdminUserIds(members);
  if (!admins.includes(targetUserId)) return false;
  return admins.length > 1;
}

export function resolveRoleView(args: {
  isPlayer: boolean;
  isAdmin: boolean;
  requested: string | null | undefined;
}): RoleView {
  if (args.isAdmin && args.isPlayer) {
    return args.requested === "admin" ? "admin" : "player";
  }
  if (args.isAdmin) return "admin";
  return "player";
}
