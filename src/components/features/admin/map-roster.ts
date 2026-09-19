import { formatSeatLabel } from "@/lib/claim-seat";
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
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    role: m.role,
    email: m.user.email,
    phoneE164: m.user.phoneE164,
    mirrorFromMembershipId: m.mirrorFromMembershipId,
    pickBackup: m.pickBackup,
  }));
}

export function toMirrorOptions(members: MemberRow[]) {
  return members
    .filter(isVisibleAdminPerson)
    .map((m) => ({
      id: m.id,
      nickname: m.nickname,
      label: formatSeatLabel(m.nickname, m.realName),
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
