import "server-only";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { isDemoMode } from "@/lib/pool-mode";
import { syncTeamStandingsFromEspn } from "@/lib/espn-standings";
import { teamLogoUrl } from "@/lib/espn-teams";
import type { StandingRow } from "@/components/NflStandingsClient";

export type LeaguePageData = {
  demoMode: boolean;
  asOf?: string;
  note?: string;
  teams: StandingRow[];
};

function demoStandingsMeta(): { asOf?: string; note?: string } {
  const dirs = [
    path.resolve(process.cwd(), "data"),
    path.resolve("/workspace/survive-sunday/app/data"),
    path.resolve("/workspace/survive-sunday/data"),
  ];
  for (const dir of dirs) {
    const file = path.join(dir, "week2-standings.json");
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, "utf8")) as {
        as_of?: string;
        note?: string;
      };
      return { asOf: raw.as_of, note: raw.note };
    }
  }
  return {};
}

export async function loadLeaguePage(): Promise<LeaguePageData> {
  const me = await requireMembership();
  const demoMode = isDemoMode(me.pool.mode);
  if (!demoMode) {
    try { await syncTeamStandingsFromEspn(); }
    catch (e) { console.error("nfl standings ESPN sync skipped", e); }
  }
  const teams = await prisma.team.findMany({
    orderBy: [{ conference: "asc" }, { division: "asc" }, { divisionRank: "asc" }],
  });
  const meta = demoMode ? demoStandingsMeta() : {};
  return {
    demoMode,
    asOf: meta.asOf,
    note: meta.note,
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
