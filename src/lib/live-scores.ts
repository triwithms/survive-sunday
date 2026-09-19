import "server-only";
import { prisma } from "@/lib/db";
import {
  gradeWeekPicks,
  undoPickMembershipEffect,
  recomputeWeeksSurvived,
} from "@/lib/grading";
import { normAbbr } from "@/lib/espn";
import { syncTeamStandingsFromEspn } from "@/lib/espn-standings";
import { scheduleScoreUpdate } from "@/lib/notification-events";
import { syncOddsFromEspnSnapshots } from "@/lib/espn-odds";
import {
  fetchEspnWeekScoreboard,
  type EspnGameSnapshot,
} from "@/lib/espn-scoreboard";

export type { EspnGameSnapshot };
export { fetchEspnWeekScoreboard };

/** ESPN → app team abbreviation. */
export function fromEspnAbbr(abbr: string): string {
  return normAbbr(abbr);
}

function matchKey(away: string, home: string) {
  return `${away}@${home}`;
}

export function buildEspnGameNote(
  snap: Pick<EspnGameSnapshot, "status" | "clockLabel" | "situationLabel">
): string | null {
  if (snap.status === "live") {
    return [snap.clockLabel || "Live", snap.situationLabel, "ESPN"]
      .filter(Boolean)
      .join(" · ");
  }
  if (snap.status === "final") return snap.clockLabel || "Final · ESPN";
  return snap.clockLabel ? `${snap.clockLabel} · ESPN` : null;
}

/**
 * Pull ESPN scoreboard into our Game rows for a pool week.
 * Overwrites demo/fake live scores. Does not invent scores — scheduled clears them.
 */
export async function syncWeekScoresFromEspn(weekId: string): Promise<{
  updated: number;
  live: number;
  final: number;
  scheduled: number;
  graded: string[];
  standingsUpdated: number;
  source: "espn";
}> {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: { games: true, pool: true },
  });
  const seasonYear = Number(String(week.pool.season).slice(0, 4)) || 2026;
  const snapshots = await fetchEspnWeekScoreboard(week.number, seasonYear);
  const byMatch = new Map(
    snapshots.map((s) => [matchKey(s.awayAbbr, s.homeAbbr), s] as const)
  );

  let updated = 0;
  let live = 0;
  let final = 0;
  let scheduled = 0;

  for (const game of week.games) {
    const snap = byMatch.get(matchKey(game.awayAbbr, game.homeAbbr));
    if (!snap) continue;

    if (snap.status === "live") live += 1;
    else if (snap.status === "final") final += 1;
    else scheduled += 1;

    const note = buildEspnGameNote(snap);

    const nextScores =
      snap.status === "scheduled"
        ? { scoreAway: null as number | null, scoreHome: null as number | null }
        : {
            scoreAway: snap.scoreAway,
            scoreHome: snap.scoreHome,
          };

    const changed =
      game.status !== snap.status ||
      game.scoreAway !== nextScores.scoreAway ||
      game.scoreHome !== nextScores.scoreHome ||
      game.note !== note;

    if (!changed) continue;

    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: snap.status,
        scoreAway: nextScores.scoreAway,
        scoreHome: nextScores.scoreHome,
        note,
      },
    });
    updated += 1;

    if (snap.status === "live" && game.status !== "final") {
      const livePicks = await prisma.pick.findMany({
        where: {
          weekId,
          gameId: game.id,
          source: { not: "missed" },
        },
        include: { membership: { include: { user: true } } },
      });
      for (const pick of livePicks) {
        if (pick.membership.role === "admin") continue;
        scheduleScoreUpdate({
          user: pick.membership.user,
          nickname: pick.membership.nickname,
          weekNumber: week.number,
          gameId: game.id,
          teamAbbr: pick.teamAbbr,
          awayAbbr: game.awayAbbr,
          homeAbbr: game.homeAbbr,
          scoreAway: nextScores.scoreAway,
          scoreHome: nextScores.scoreHome,
          clockLabel: snap.clockLabel,
        });
      }
    }
  }

  try {
    await syncOddsFromEspnSnapshots(prisma, week.games, snapshots);
  } catch (e) {
    console.error("espn odds sync skipped", e);
  }

  // Ungrade picks whose game is no longer final (e.g. premature demo finals).
  const picks = await prisma.pick.findMany({
    where: {
      weekId,
      result: { in: ["win", "loss", "push"] },
      NOT: { source: "missed" },
    },
    include: { game: true },
  });
  for (const pick of picks) {
    if (!pick.game || pick.game.status === "final") continue;
    await undoPickMembershipEffect(pick.membershipId, pick.result);
    await prisma.pick.update({
      where: { id: pick.id },
      data: { result: "pending", gradedAt: null },
    });
  }

  const graded = await gradeWeekPicks(weekId);
  await recomputeWeeksSurvived(week.poolId);
  const standings = await syncTeamStandingsFromEspn();

  return {
    updated,
    live,
    final,
    scheduled,
    graded,
    standingsUpdated: standings.updated,
    source: "espn",
  };
}

export { shouldPollLiveScores } from "@/lib/game-display";
