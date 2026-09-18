import { isSeatClaimed } from "@/lib/claim-seat";
import type { RosterMember } from "./roster-types";

export function rosterRowDetail(member: RosterMember): string {
  const name = member.realName?.trim() || "no real name";
  const claim =
    member.role === "admin"
      ? "Commissioner"
      : isSeatClaimed(member.email)
        ? "Joined"
        : "Not joined";
  return `${name} · ${claim}`;
}
