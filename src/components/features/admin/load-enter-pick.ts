import "server-only";
import { prisma } from "@/lib/db";
import { isWeekLocked } from "@/lib/grading";
import { isPoolParticipant } from "@/lib/pool-rules";
import { toEnterPickMember, weekBits, weekTeamOptions } from "./enter-pick-map";
import type { EnterPickData } from "./enter-pick-types";

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
        playingFromWeek: true,
        usedTeamsJson: true,
        picks: {
          select: {
            teamAbbr: true,
            source: true,
            gameId: true,
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
        status: true,
        lockAt: true,
        lockOverrideAt: true,
        games: {
          select: {
            id: true,
            awayAbbr: true,
            homeAbbr: true,
            status: true,
            kickoff: true,
          },
        },
      },
    }),
    prisma.team.findMany({ select: { abbr: true, name: true } }),
  ]);
  const names = new Map(teams.map((t) => [t.abbr, t.name]));
  const bits = weekBits(weeks);
  const current = weeks.find((week) => week.number === currentWeek);
  return {
    currentWeek,
    currentWeekOpen: Boolean(
      current && current.status === "open" && !isWeekLocked(current)
    ),
    members: members.filter(isPoolParticipant).map((m) =>
      toEnterPickMember(m, currentWeek, bits)
    ),
    weeks: weeks.map((w) => ({
      number: w.number,
      teams: weekTeamOptions(w.games, names),
    })),
  };
}
