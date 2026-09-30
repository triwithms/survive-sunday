import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { scheduleTeamStandingsRefresh } from "@/lib/espn-standings";
import type { StandingRow } from "@/components/NflStandingsClient";

export type LeaguePageData = {
  asOf?: string;
  note?: string;
  teams: StandingRow[];
};

export async function loadLeaguePage(): Promise<LeaguePageData> {
  await requireMembership();
  scheduleTeamStandingsRefresh();
  const teams = await prisma.team.findMany({
    orderBy: [{ conference: "asc" }, { division: "asc" }, { divisionRank: "asc" }],
    select: {
      abbr: true,
      name: true,
      conference: true,
      division: true,
      wins: true,
      losses: true,
      ties: true,
      divisionRank: true,
      pointsFor: true,
      pointsAgainst: true,
      priorYearRank: true,
    },
  });
  return {
    teams: teams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      logoUrl: null,
      conference: t.conference,
      division: t.division,
      wins: t.wins,
      losses: t.losses,
      ties: t.ties,
      divisionRank: t.divisionRank,
      pointsFor: t.pointsFor,
      pointsAgainst: t.pointsAgainst,
      priorYearRank: t.priorYearRank,
    })),
  };
}
