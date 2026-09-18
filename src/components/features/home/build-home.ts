import { prisma } from "@/lib/db";
import { formatScoreLine } from "@/lib/game-display";
import { getTeamInjuries } from "@/lib/live-injuries";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
} from "@/lib/matchup-meta";
import {
  nextWeekOpenHeadline,
  pickHrefForWeek,
  type PlayerPickWeek,
} from "@/lib/next-week-picks";
import { teamLogoUrl } from "@/lib/espn-teams";
import type { HomeHeroProps } from "./types";

type HeroPick = {
  teamAbbr: string;
  source: string;
  result: string | null;
  game: {
    awayAbbr: string;
    homeAbbr: string;
    spreadHome: number | null;
    spreadAway: number | null;
    mlHome: number | null;
    mlAway: number | null;
    scoreAway: number | null;
    scoreHome: number | null;
    status: string;
    note: string | null;
  } | null;
};

export async function buildHomeHero(args: {
  myPick: HeroPick;
  canChangePick: boolean;
  isCurrentWeek: boolean;
  decision: PlayerPickWeek;
  hasNextPick: boolean;
  weekNumber: number;
  status: HomeHeroProps["status"];
}): Promise<HomeHeroProps> {
  const { myPick, decision } = args;
  const myTeam = await prisma.team.findUnique({
    where: { abbr: myPick.teamAbbr },
  });
  const injuries = await getTeamInjuries(myPick.teamAbbr);
  const fav = myPick.game
    ? resolveFavourite({
        homeAbbr: myPick.game.homeAbbr,
        awayAbbr: myPick.game.awayAbbr,
        spreadHome: myPick.game.spreadHome,
        spreadAway: myPick.game.spreadAway,
        mlHome: myPick.game.mlHome,
        mlAway: myPick.game.mlAway,
      })
    : null;
  const nextOpen =
    args.isCurrentWeek &&
    (decision.nextWeekOpen ||
      decision.reason === "slate_not_ready" ||
      decision.reason === "next_game_pending");
  return {
    teamAbbr: myPick.teamAbbr,
    logoUrl: teamLogoUrl(myPick.teamAbbr, myTeam?.logoUrl),
    priorStanding:
      [formatPriorYearRank(myTeam?.priorYearRank), myTeam
        ? formatCurrentStanding({
            wins: myTeam.wins,
            losses: myTeam.losses,
            ties: myTeam.ties,
            divisionRank: myTeam.divisionRank,
            conference: myTeam.conference,
            division: myTeam.division,
          })
        : null].filter(Boolean).join(" · ") || null,
    gameLine: myPick.game
      ? `${myPick.game.awayAbbr} @ ${myPick.game.homeAbbr}${
          formatScoreLine(myPick.game) ? ` · ${formatScoreLine(myPick.game)}` : ""
        }`
      : null,
    injuryCounts: injuries && !injuries.failed ? injuries.counts : null,
    favouriteLabel: fav?.label ?? null,
    imported: myPick.source === "imported",
    status: args.status,
    result: myPick.result,
    actionHref: args.canChangePick
      ? pickHrefForWeek(args.weekNumber)
      : nextOpen
        ? pickHrefForWeek(decision.nextWeek)
        : null,
    actionLabel: args.canChangePick
      ? "Change pick"
      : nextOpen
        ? args.hasNextPick
          ? `Change Week ${decision.nextWeek} pick`
          : nextWeekOpenHeadline(decision.nextWeek, decision.slateReady)
        : null,
  };
}
