import { isSeatClaimed } from "@/lib/claim-seat";
import {
  PICK_BACKUP_MIRROR,
  PICK_BACKUP_RANKED,
  resolvePickBackupMode,
} from "@/lib/pick-mirror";
import type { RosterMember } from "./roster-types";

export function rosterRowDetail(member: RosterMember): string {
  const name = member.realName?.trim() || "no real name";
  const claim =
    member.role === "admin"
      ? "Administrator"
      : isSeatClaimed(member.email)
        ? "Joined"
        : "Not joined";
  return `${name} · ${claim}`;
}

export function claimShortLabel(member: RosterMember): string {
  if (member.role === "admin") return "Administrator";
  return isSeatClaimed(member.email) ? "Joined" : "Unclaimed";
}

export function backupShortLabel(
  member: RosterMember,
  sourceNickname?: string | null
): string {
  if (member.role === "admin") return "—";
  const mode = resolvePickBackupMode(
    member.pickBackup,
    member.mirrorFromMembershipId
  );
  if (mode === PICK_BACKUP_RANKED) return "Ranked";
  if (mode === PICK_BACKUP_MIRROR) {
    const nick = (sourceNickname ?? "").trim();
    return nick ? `Copy ${nick}` : "Copy member";
  }
  return "Off";
}

export function rosterRowSubtitle(
  member: RosterMember,
  sourceNickname?: string | null
): string {
  return `${claimShortLabel(member)} · ${backupShortLabel(member, sourceNickname)}`;
}
