import { prefsFromRow } from "@/lib/notify-pref-columns";
import { isPlayerSeat } from "@/lib/roles";
import type { MemberRow } from "./types";

/** No spectator admin seat, and no leftover person named Commissioner. */
export function isVisibleAdminPerson(member: {
  role: string;
  nickname: string;
}): boolean {
  if (!isPlayerSeat(member)) return false;
  return member.nickname.trim().toLowerCase() !== "commissioner";
}

export function toRosterMembers(members: MemberRow[]) {
  return members.filter(isVisibleAdminPerson).map((m) => ({
    id: m.id,
    userId: m.userId,
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    role: m.role,
    email: m.user.email,
    phoneE164: m.user.phoneE164,
    notifyPref: m.user.notifyPref ?? null,
    notifyPrefs: prefsFromRow(m.user.notificationPreference),
    mirrorFromMembershipId: m.mirrorFromMembershipId,
    pickBackup: m.pickBackup,
  }));
}

export function toRemoveMembers(members: MemberRow[]) {
  return members.filter(isVisibleAdminPerson).map((m) => ({
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    role: m.role,
  }));
}
