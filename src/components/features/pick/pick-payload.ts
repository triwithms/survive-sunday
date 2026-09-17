import { MISSED_TEAM } from "@/lib/grading";
import { teamLogoUrl } from "@/lib/espn-teams";
import { sanitizeGameOdds } from "@/lib/odds";
import type { PickMatchup } from "./types";

type TeamRow = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  priorYearRank: number | null;
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number | null;
  conference: string;
  division: string;
};

type GameRow = {
  id: string;
  kickoff: Date;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  note: string | null;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  awayAbbr: string;
  homeAbbr: string;
};

export function usedTeamAbbrs(
  priorAbbrs: string[],
  seededUsed: string[],
  currentAbbr: string | null
) {
  const seeded = seededUsed.filter(
    (abbr) => abbr !== currentAbbr && abbr !== MISSED_TEAM
  );
  return Array.from(new Set([...priorAbbrs, ...seeded]));
}

export function pickMatchupsFromGames(
  games: GameRow[],
  teamByAbbr: Map<string, TeamRow>,
  used: string[]
): PickMatchup[] {
  function sidePayload(abbr: string) {
    const team = teamByAbbr.get(abbr);
    return {
      abbr,
      name: team?.name ?? abbr,
      logoUrl: teamLogoUrl(abbr, team?.logoUrl),
      alreadyUsed: used.includes(abbr),
      priorYearRank: team?.priorYearRank ?? null,
      standing: team
        ? {
            wins: team.wins,
            losses: team.losses,
            ties: team.ties,
            divisionRank: team.divisionRank,
            conference: team.conference,
            division: team.division,
          }
        : null,
    };
  }
  return games.map((game) => {
    const odds = sanitizeGameOdds(game);
    return {
      id: game.id,
      kickoff:
        game.kickoff instanceof Date && !Number.isNaN(game.kickoff.getTime())
          ? game.kickoff.toISOString()
          : "",
      status: game.status,
      scoreAway: game.scoreAway,
      scoreHome: game.scoreHome,
      note: game.note,
      spreadHome: odds.spreadHome,
      spreadAway: odds.spreadAway,
      mlHome: odds.mlHome,
      mlAway: odds.mlAway,
      away: sidePayload(game.awayAbbr),
      home: sidePayload(game.homeAbbr),
    };
  });
}
