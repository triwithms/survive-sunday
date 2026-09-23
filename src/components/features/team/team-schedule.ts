import { isFinalGame, NFL_DISPLAY_TZ } from "@/lib/game-display";

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
  if (kickoff == null) return "";
  const date = typeof kickoff === "string" ? new Date(kickoff) : kickoff;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: NFL_DISPLAY_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-CA", {
    timeZone: NFL_DISPLAY_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
