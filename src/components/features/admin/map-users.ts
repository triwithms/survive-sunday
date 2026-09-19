import { isSeatClaimed } from "@/lib/claim-seat";
import { maskEmail } from "@/lib/otp";
import {
  canDemoteAdmin,
  hasRole,
  isPlayerSeat,
  POOL_ROLES,
} from "@/lib/roles";
import type { MemberRow } from "./types";

export function adminUserIdSet(
  grants: { role: string; userId: string }[]
): Set<string> {
  return new Set(
    grants
      .filter((g) => hasRole([g.role], POOL_ROLES.administrator))
      .map((g) => g.userId)
  );
}

export function toPasswordMembers(members: MemberRow[]) {
  return members.filter(isPlayerSeat).map((m) => ({
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    claimed: isSeatClaimed(m.user.email),
    email: isSeatClaimed(m.user.email) ? m.user.email : null,
    emailMasked: isSeatClaimed(m.user.email) ? maskEmail(m.user.email) : null,
  }));
}

export function toRoleMembers(
  members: MemberRow[],
  adminUserIds: Set<string>,
  sessionUserId: string
) {
  return members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    role: m.role,
    isAdmin: adminUserIds.has(m.userId),
    isYou: m.userId === sessionUserId,
  }));
}

export function toDemoteIds(
  members: MemberRow[],
  adminUserIds: Set<string>,
  grants: { role: string; userId: string }[]
) {
  const flags = members.map((row) => ({
    role: row.role,
    isAdmin: adminUserIds.has(row.userId),
    userId: row.userId,
  }));
  return members
    .filter((m) => {
      // INTERNAL var name kept; user-facing copy says Administrator.
      const commissioner = members.some(
        (row) => row.userId === m.userId && row.role === "admin"
      );
      return (
        isPlayerSeat(m) &&
        adminUserIds.has(m.userId) &&
        !commissioner &&
        canDemoteAdmin(flags, m.userId, grants)
      );
    })
    .map((m) => m.id);
}
