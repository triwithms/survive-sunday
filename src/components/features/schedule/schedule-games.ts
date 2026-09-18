import { resolveFavourite } from "@/lib/matchup-meta";
import { formatKickoff } from "@/lib/utils";
import { formatMatchupListLine } from "@/lib/game-display";
import { teamLogoUrl } from "@/lib/espn-teams";
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
};

export function mapScheduleGames(
  games: GameBits[],
  logoByAbbr: Map<string, string | null>
): ScheduleGame[] {
  return games.map((game) => {
    const fav = resolveFavourite({
      homeAbbr: game.homeAbbr,
      awayAbbr: game.awayAbbr,
      spreadHome: game.spreadHome,
      spreadAway: game.spreadAway,
      mlHome: game.mlHome,
      mlAway: game.mlAway,
    });
    return {
      id: game.id,
      awayAbbr: game.awayAbbr,
      homeAbbr: game.homeAbbr,
      status: game.status,
      scoreLine: formatMatchupListLine(game) || formatKickoff(game.kickoff),
      favouriteLabel: fav?.label ?? null,
      awayLogoUrl: teamLogoUrl(game.awayAbbr, logoByAbbr.get(game.awayAbbr)),
      homeLogoUrl: teamLogoUrl(game.homeAbbr, logoByAbbr.get(game.homeAbbr)),
    };
  });
}
