import { teamLogoUrl } from "@/lib/espn-teams";
import { formatMatchupListLine } from "@/lib/game-display";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  playerSpreadLabel,
} from "@/lib/matchup-meta";
import { formatWinPct } from "@/lib/standings-format";
import { formatKickoff } from "@/lib/utils";
import type { TeamHeaderView, TeamThisWeekView } from "./types";

type TeamRow = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  conference: string;
  division: string;
  wins: number;
  losses: number;
  ties: number;
  divisionRank: number | null;
  pointsFor: number;
  pointsAgainst: number;
  priorYearRank: number | null;
};

type GameRow = {
  awayAbbr: string;
  homeAbbr: string;
  kickoff: Date;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
};

export function buildTeamHeader(team: TeamRow): TeamHeaderView {
  const record =
    team.ties > 0
      ? `${team.wins}-${team.losses}-${team.ties}`
      : `${team.wins}-${team.losses}`;
  const standing = {
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    divisionRank: team.divisionRank,
    conference: team.conference,
    division: team.division,
  };
  return {
    abbr: team.abbr,
    name: team.name,
    conference: team.conference,
    division: team.division,
    logoUrl: teamLogoUrl(team.abbr, team.logoUrl),
    record,
    winPct: formatWinPct(team.wins, team.losses, team.ties),
    standing: formatCurrentStanding(standing),
    priorYear: formatPriorYearRank(team.priorYearRank),
    pointsFor: team.pointsFor,
    pointsAgainst: team.pointsAgainst,
  };
}

export function buildThisWeek(
  abbr: string,
  game: GameRow | undefined
): TeamThisWeekView | null {
  if (!game) return null;
  const atHome = game.homeAbbr === abbr;
  const opponentAbbr = atHome ? game.awayAbbr : game.homeAbbr;
  return {
    opponentAbbr,
    atHome,
    kickoffLabel: formatKickoff(game.kickoff),
    scoreLine: formatMatchupListLine(game),
    favouriteLabel: playerSpreadLabel(game),
  };
}
