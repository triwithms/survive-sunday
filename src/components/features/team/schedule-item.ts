import { espnClockFromNote, isFinalGame, isLiveGame } from "@/lib/game-display";
import {
  formatSeasonKickoff,
  teamGameResult,
  teamScoreLine,
  type TeamScheduleGameIn,
  type TeamScheduleItem,
  type TeamScheduleSnap,
} from "./team-schedule";

export function overlayScheduleSnap(
  game: TeamScheduleGameIn,
  snaps?: TeamScheduleSnap[]
): TeamScheduleGameIn {
  const snap = snaps?.find(
    (row) => row.awayAbbr === game.awayAbbr && row.homeAbbr === game.homeAbbr
  );
  if (!snap) return game;
  if (isFinalGame(game.status) && !isFinalGame(snap.status)) return game;
  return {
    ...game,
    status: snap.status || game.status,
    scoreAway: snap.scoreAway ?? game.scoreAway,
    scoreHome: snap.scoreHome ?? game.scoreHome,
  };
}

export function snapClock(
  game: TeamScheduleGameIn,
  snaps?: TeamScheduleSnap[]
): string | null {
  return (
    snaps?.find(
      (row) => row.awayAbbr === game.awayAbbr && row.homeAbbr === game.homeAbbr
    )?.clockLabel ?? null
  );
}

export function toScheduleItem(
  abbr: string,
  game: TeamScheduleGameIn,
  clockHint?: string | null
): TeamScheduleItem {
  const atHome = game.homeAbbr === abbr;
  const status = isLiveGame(game.status)
    ? "live"
    : isFinalGame(game.status)
      ? "final"
      : "scheduled";
  return {
    id: game.id,
    week: game.week,
    bye: false,
    opponentAbbr: atHome ? game.awayAbbr : game.homeAbbr,
    atHome,
    kickoffLabel: formatSeasonKickoff(game.kickoff),
    status,
    result: teamGameResult(abbr, game),
    scoreLine: teamScoreLine(abbr, game),
    liveClock:
      status === "live"
        ? espnClockFromNote(game.note) || clockHint || null
        : null,
  };
}

export function byeScheduleItem(week: number): TeamScheduleItem {
  return {
    id: `bye-w${week}`,
    week,
    bye: true,
    opponentAbbr: null,
    atHome: false,
    kickoffLabel: "",
    status: "scheduled",
    result: null,
    scoreLine: null,
    liveClock: null,
  };
}
