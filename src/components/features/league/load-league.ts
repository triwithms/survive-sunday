import "server-only";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { syncTeamStandingsFromEspn } from "@/lib/espn-standings";
import { teamLogoUrl } from "@/lib/espn-teams";
import type { StandingRow } from "@/components/NflStandingsClient";

export type LeaguePageData = {
  asOf?: string;
  note?: string;
  teams: StandingRow[];
};

export async function loadLeaguePage(): Promise<LeaguePageData> {
  await requireMembership();
  try {
    await syncTeamStandingsFromEspn();
  } catch (e) {
    console.error("nfl standings ESPN sync skipped", e);
  }
  const teams = await prisma.team.findMany({
    orderBy: [{ conference: "asc" }, { division: "asc" }, { divisionRank: "asc" }],
  });
  return {
    teams: teams.map((t) => ({
      abbr: t.abbr,
      name: t.name,
      logoUrl: teamLogoUrl(t.abbr, t.logoUrl),
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
