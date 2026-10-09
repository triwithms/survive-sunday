import { isPoolParticipant } from "./pool-rules";
import type { WeekWrapPlayer } from "./week-wrap-types";

export type WrapMember = {
  id: string;
  nickname: string;
  status: string;
  role?: string;
  isParticipant?: boolean;
  /** Set when status was replayed through this week. */
  outBeforeWeek?: boolean;
};

export type WrapPick = {
  membershipId: string;
  teamAbbr: string;
  result: string | null;
};

export function isWrapLoss(
  teamAbbr: string | null,
  result: string | null
): boolean {
  if ((teamAbbr ?? "").toUpperCase() === "MISS") return true;
  const value = (result ?? "").toLowerCase();
  return value === "loss" || value === "push" || value === "missed";
}

export function weekWrapPlayers(
  members: WrapMember[],
  picks: WrapPick[]
): WeekWrapPlayer[] {
  const byMember = new Map(picks.map((pick) => [pick.membershipId, pick]));
  return members
    .filter((member) => isPoolParticipant(member))
    .map((member) => {
      const pick = byMember.get(member.id);
      const teamAbbr = pick?.teamAbbr ?? null;
      const result = pick?.result ?? null;
      const eliminatedThisWeek =
        member.outBeforeWeek === true
          ? false
          : member.status === "eliminated" && isWrapLoss(teamAbbr, result);
      return {
        id: member.id,
        nickname: member.nickname,
        status: member.status,
        teamAbbr,
        result,
        outBeforeWeek: member.outBeforeWeek,
        eliminatedThisWeek,
      };
    })
    .sort((a, b) => a.nickname.localeCompare(b.nickname));
}
