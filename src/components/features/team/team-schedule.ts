import { isFinalGame } from "@/lib/game-display";
import { formatEasternDateTime } from "@/lib/eastern-time";

export type TeamGameResult = "win" | "loss" | "tie";

export type TeamScheduleItem = {
  id: string;
  week: number;
  bye: boolean;
  opponentAbbr: string | null;
  atHome: boolean;
  kickoffLabel: string;
  status: "scheduled" | "live" | "final";
  result: TeamGameResult | null;
  scoreLine: string | null;
  liveClock: string | null;
};

export type TeamScheduleGameIn = {
  id: string;
  week: number;
  awayAbbr: string;
  homeAbbr: string;
  kickoff: Date | string;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  note?: string | null;
};

export type TeamScheduleFileGame = {
  week: number;
  awayAbbr: string;
  homeAbbr: string;
  kickoff: Date | string;
};

export type TeamScheduleSnap = {
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel?: string | null;
};

export function formatSeasonKickoff(
  kickoff: Date | string | null | undefined
): string {
  const day = formatEasternDateTime(
    kickoff,
    { weekday: "short", month: "short", day: "numeric" },
    false
  );
  const time = formatEasternDateTime(
    kickoff,
    { hour: "numeric", minute: "2-digit" },
    false
  );
  if (!day || !time) return "";
  return `${day}, ${time} ET`;
}

export function teamGameResult(
  abbr: string,
  game: Pick<
    TeamScheduleGameIn,
    "status" | "homeAbbr" | "awayAbbr" | "scoreHome" | "scoreAway"
  >
): TeamGameResult | null {
  if (!isFinalGame(game.status)) return null;
  if (game.scoreHome == null || game.scoreAway == null) return null;
  const us = game.homeAbbr === abbr ? game.scoreHome : game.scoreAway;
  const them = game.homeAbbr === abbr ? game.scoreAway : game.scoreHome;
  if (us > them) return "win";
  if (us < them) return "loss";
  return "tie";
}

export function teamScoreLine(
  abbr: string,
  game: Pick<TeamScheduleGameIn, "homeAbbr" | "scoreHome" | "scoreAway">
): string | null {
  if (game.scoreHome == null || game.scoreAway == null) return null;
  const us = game.homeAbbr === abbr ? game.scoreHome : game.scoreAway;
  const them = game.homeAbbr === abbr ? game.scoreAway : game.scoreHome;
  return `${us}–${them}`;
}
