import "server-only";
import { prisma } from "@/lib/db";
import { MISSED_TEAM, parseUsedTeams } from "@/lib/grading";
import { isPoolParticipant } from "@/lib/pool-rules";
import type { EnterPickData, EnterPickTeam } from "./enter-pick-types";

function weekTeamOptions(
  games: { awayAbbr: string; homeAbbr: string }[],
  names: Map<string, string>
): EnterPickTeam[] {
  const rows: EnterPickTeam[] = [];
  for (const g of games) {
    const away = names.get(g.awayAbbr) ?? g.awayAbbr;
    const home = names.get(g.homeAbbr) ?? g.homeAbbr;
    rows.push({ abbr: g.awayAbbr, name: `${g.awayAbbr} ${away} @ ${g.homeAbbr}` });
    rows.push({ abbr: g.homeAbbr, name: `${g.homeAbbr} ${home} vs ${g.awayAbbr}` });
  }
  return rows.sort((a, b) => a.abbr.localeCompare(b.abbr));
}

export async function loadEnterPick(
  poolId: string,
  currentWeek: number
): Promise<EnterPickData> {
  const [members, weeks, teams] = await Promise.all([
    prisma.membership.findMany({
      where: { poolId },
      orderBy: { nickname: "asc" },
      select: {
        id: true,
        nickname: true,
        realName: true,
        status: true,
        role: true,
        isParticipant: true,
        usedTeamsJson: true,
        picks: {
          select: {
            teamAbbr: true,
            source: true,
            week: { select: { number: true } },
          },
        },
      },
    }),
    prisma.week.findMany({
      where: { poolId },
      orderBy: { number: "asc" },
      select: {
        number: true,
        games: { select: { awayAbbr: true, homeAbbr: true } },
      },
    }),
    prisma.team.findMany({ select: { abbr: true, name: true } }),
  ]);
  const names = new Map(teams.map((t) => [t.abbr, t.name]));
  return {
    currentWeek,
    members: members.filter(isPoolParticipant).map((m) => ({
      id: m.id,
      nickname: m.nickname,
      realName: m.realName,
      status: m.status,
      usedTeams: parseUsedTeams(m.usedTeamsJson).filter((t) => t !== MISSED_TEAM),
      picks: m.picks
        .filter((p) => p.source !== "missed" && p.teamAbbr !== MISSED_TEAM)
        .map((p) => ({ weekNumber: p.week.number, teamAbbr: p.teamAbbr })),
    })),
    weeks: weeks.map((w) => ({
      number: w.number,
      teams: weekTeamOptions(w.games, names),
    })),
  };
}
