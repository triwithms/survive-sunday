import { formatSeatLabel } from "@/lib/claim-seat";
import type { MemberRow } from "./types";

export function toRosterMembers(members: MemberRow[]) {
  return members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    role: m.role,
    email: m.user.email,
    mirrorFromMembershipId: m.mirrorFromMembershipId,
    pickBackup: m.pickBackup,
  }));
}

export function toMirrorOptions(members: MemberRow[]) {
  return members
    .filter((m) => m.role !== "admin")
    .map((m) => ({
      id: m.id,
      nickname: m.nickname,
      label: formatSeatLabel(m.nickname, m.realName),
    }));
}

export function toRemoveMembers(members: MemberRow[]) {
  return members.map((m) => ({
    id: m.id,
    nickname: m.nickname,
    realName: m.realName,
    status: m.status,
    role: m.role,
  }));
}
