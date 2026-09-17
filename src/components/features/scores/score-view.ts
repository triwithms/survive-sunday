import { MISSED_TEAM } from "@/lib/grading";
import { teamLogoUrl } from "@/lib/espn-teams";
import type { ScoreGameCardGame } from "./types";
import type { ScoresPickRowData } from "./screen-types";

function statusRank(status: string) {
  if (status === "live") return 0;
  if (status === "scheduled") return 1;
  return 2;
}

export function sortScoreGames<T extends { status: string; kickoff: Date }>(
  games: T[]
) {
  return [...games].sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    return a.kickoff.getTime() - b.kickoff.getTime();
  });
}

export function scoreCardGames(
  games: Array<{
    id: string;
    awayAbbr: string;
    homeAbbr: string;
    scoreAway: number | null;
    scoreHome: number | null;
    status: string;
    note: string | null;
    kickoff: Date;
    network: string | null;
  }>,
  logoByAbbr: Map<string, string | null>
): ScoreGameCardGame[] {
  return games.map((game) => ({
    id: game.id,
    awayAbbr: game.awayAbbr,
    homeAbbr: game.homeAbbr,
    scoreAway: game.scoreAway,
    scoreHome: game.scoreHome,
    status: game.status,
    note: game.note,
    kickoff: game.kickoff,
    network: game.network,
    awayLogoUrl: teamLogoUrl(game.awayAbbr, logoByAbbr.get(game.awayAbbr)),
    homeLogoUrl: teamLogoUrl(game.homeAbbr, logoByAbbr.get(game.homeAbbr)),
  }));
}

export function scoresPickRows(
  participants: Array<{
    id: string;
    nickname: string;
    realName: string | null;
    status: string;
    autoPickStamps: number | null;
    picks: Array<{ source: string; teamAbbr: string; result: string | null }>;
  }>,
  meId: string,
  revealAllPicks: boolean,
  logoByAbbr: Map<string, string | null>
): ScoresPickRowData[] {
  return participants.map((member) => {
    const rawPick = member.picks[0];
    const isSelf = member.id === meId;
    const pick =
      rawPick && rawPick.source !== "missed" && rawPick.teamAbbr !== MISSED_TEAM
        ? rawPick : null;
    const result = rawPick?.result ?? "pending";
    return {
      id: member.id,
      nickname: member.nickname,
      realName: member.realName,
      status: member.status,
      autoPickStamps: member.autoPickStamps,
      isSelf,
      showPick: revealAllPicks || isSelf,
      teamAbbr: pick?.teamAbbr ?? null,
      logoUrl: pick ? teamLogoUrl(pick.teamAbbr, logoByAbbr.get(pick.teamAbbr)) : null,
      result,
      noPickLabel: `No pick${rawPick?.result ? ` · ${result}` : ""}`,
    };
  });
}
