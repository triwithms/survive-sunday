import { isPlayerSeat } from "@/lib/roles";
import { isPoolParticipant } from "@/lib/pool-rules";
import type { MemberRow } from "./types";

export function toTransferMembers(
  members: MemberRow[],
  sessionUserId: string
) {
  return members
    .filter((m) => isPlayerSeat(m) && m.userId !== sessionUserId)
    .map((m) => ({
      id: m.id,
      nickname: m.nickname,
      status: m.status,
    }));
}

export function survivalCounts(members: MemberRow[]) {
  const players = members.filter(isPoolParticipant);
  return {
    oneLossCount: players.filter((m) => m.status === "one_loss").length,
    undefeatedCount: players.filter((m) => m.status === "undefeated").length,
  };
}

export function toWeekGames(
  games: { id: string; awayAbbr: string; homeAbbr: string; status: string }[]
) {
  return games.map((g) => ({
    id: g.id,
    label: `${g.awayAbbr} @ ${g.homeAbbr}`,
    status: g.status,
  }));
}
