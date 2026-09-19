import { isSeatClaimed } from "@/lib/claim-seat";
import {
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

export function backupShortLabel(member: RosterMember): string {
  if (member.role === "admin") return "—";
  const mode = resolvePickBackupMode(
    member.pickBackup,
    member.mirrorFromMembershipId
  );
  if (mode === PICK_BACKUP_RANKED) return "Ranked";
  return "Off";
}

export function rosterRowSubtitle(member: RosterMember): string {
  return `${claimShortLabel(member)} · ${backupShortLabel(member)}`;
}

export function needsEmailToLogIn(member: RosterMember): boolean {
  return member.role !== "admin" && !(member.email ?? "").trim();
}

export function rosterMatches(member: RosterMember, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [member.nickname, member.realName, member.email, member.phoneE164]
    .filter((v): v is string => Boolean(v && v.trim()))
    .some((v) => v.toLowerCase().includes(q));
}
