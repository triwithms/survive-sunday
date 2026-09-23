import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { getTeamInjuries } from "@/lib/live-injuries";
import { getTeamCoach } from "@/lib/team-coaches";
import {
  getTeamNews,
  getTeamProfile,
  getTeamRoster,
  listNflPlayers,
  withLiveInjuries,
} from "@/lib/team-research";
import { buildTeamHeader, buildThisWeek } from "./build-team-view";
import { teamAbbr } from "./team-paths";
import type { TeamPageData } from "./types";

export async function loadTeamPage(raw: string): Promise<TeamPageData> {
  const me = await requireMembership();
  const abbr = teamAbbr(raw);
  const team = await prisma.team.findUnique({ where: { abbr } });
  if (!team) notFound();

  const [news, injuries, coach] = await Promise.all([
    getTeamNews(abbr),
    getTeamInjuries(abbr),
    getTeamCoach(abbr),
  ]);
  const players = withLiveInjuries(listNflPlayers(abbr), injuries.injuries);
  const roster = getTeamRoster(abbr);
  const profile = getTeamProfile(abbr);
  const week = await prisma.week.findUnique({
    where: {
      poolId_number: { poolId: me.poolId, number: me.pool.currentWeek },
    },
    include: { games: true },
  });
  const game = week?.games.find(
    (row) => row.awayAbbr === abbr || row.homeAbbr === abbr
  );

  return {
    abbr,
    header: buildTeamHeader(team),
    thisWeek: buildThisWeek(abbr, game),
    style: profile
      ? {
          offence: profile.offence_lean,
          defence: profile.defence_lean,
          runPass: profile.run_pass_lean,
          basis: profile.lean_basis ?? null,
        }
      : null,
    coach,
    offence: players.filter((p) => p.side === "offence"),
    defence: players.filter((p) => p.side === "defence"),
    special: players.filter((p) => p.side === "special_teams"),
    rolesApproximate: Boolean(roster?.rolesApproximate),
    injuries,
    news,
  };
}
