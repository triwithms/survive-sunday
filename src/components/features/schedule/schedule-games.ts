import { playerSpreadLabel } from "@/lib/matchup-meta";
import { formatKickoff } from "@/lib/utils";
import { formatMatchupListLine } from "@/lib/game-display";
import type { ScheduleGame } from "./types";

type GameBits = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  kickoff: Date;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  scoreAway: number | null;
  scoreHome: number | null;
  note: string | null;
  network: string | null;
};

export function mapScheduleGames(games: GameBits[]): ScheduleGame[] {
  return games.map((game) => ({
    id: game.id,
    awayAbbr: game.awayAbbr,
    homeAbbr: game.homeAbbr,
    status: game.status,
    scoreAway: game.scoreAway,
    scoreHome: game.scoreHome,
    note: game.note,
    kickoff: game.kickoff,
    network: game.network,
    scoreLine: formatMatchupListLine(game) || formatKickoff(game.kickoff),
    favouriteLabel: playerSpreadLabel(game),
    awayLogoUrl: null,
    homeLogoUrl: null,
  }));
}
