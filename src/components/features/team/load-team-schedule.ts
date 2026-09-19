import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireMembership } from "@/lib/require-membership";
import { peekCachedWeekScoreboard } from "@/lib/espn-scoreboard";
import { syncWeekEspnForPage } from "@/lib/week-espn-refresh";
import { loadNormalizedSeason } from "@/lib/season-schedule";
import { mergeTeamSchedule } from "./merge-team-schedule";
import { teamAbbr } from "./team-paths";
import type { TeamScheduleFileGame, TeamScheduleItem } from "./team-schedule";

export type TeamScheduleData = {
  abbr: string;
  name: string;
  games: TeamScheduleItem[];
};

function fileGamesFor(abbr: string): TeamScheduleFileGame[] | null {
  try {
    const rows: TeamScheduleFileGame[] = [];
    for (const week of loadNormalizedSeason()) {
      for (const game of week.games) {
        if (game.awayAbbr === abbr || game.homeAbbr === abbr) {
          rows.push({
            week: week.week,
            awayAbbr: game.awayAbbr,
            homeAbbr: game.homeAbbr,
            kickoff: game.kickoff,
          });
        }
      }
    }
    return rows;
  } catch {
    return null;
  }
}

function cacheMap() {
  const out = new Map<
    number,
    NonNullable<ReturnType<typeof peekCachedWeekScoreboard>>
  >();
  for (let week = 1; week <= 18; week++) {
    const hit = peekCachedWeekScoreboard(week);
    if (hit?.length) out.set(week, hit);
  }
  return out;
}

export async function loadTeamSchedule(raw: string): Promise<TeamScheduleData> {
  const me = await requireMembership();
  const abbr = teamAbbr(raw);
  const team = await prisma.team.findUnique({
    where: { abbr },
    select: { abbr: true, name: true },
  });
  if (!team) notFound();

  const current = await prisma.week.findUnique({
    where: { poolId_number: { poolId: me.poolId, number: me.pool.currentWeek } },
    select: { id: true },
  });
  if (current) {
    await syncWeekEspnForPage(current.id).catch((err) => {
      console.error("team schedule espn sync skipped", err);
    });
  }

  const weeks = await prisma.week.findMany({
    where: { poolId: me.poolId },
    orderBy: { number: "asc" },
    include: {
      games: {
        where: { OR: [{ homeAbbr: abbr }, { awayAbbr: abbr }] },
        orderBy: { kickoff: "asc" },
      },
    },
  });
  const dbGames = weeks.flatMap((week) =>
    week.games.map((game) => ({
      id: game.id,
      week: week.number,
      awayAbbr: game.awayAbbr,
      homeAbbr: game.homeAbbr,
      kickoff: game.kickoff,
      status: game.status,
      scoreAway: game.scoreAway,
      scoreHome: game.scoreHome,
      note: game.note,
    }))
  );

  return {
    abbr,
    name: team.name,
    games: mergeTeamSchedule(abbr, dbGames, fileGamesFor(abbr), cacheMap()),
  };
}
