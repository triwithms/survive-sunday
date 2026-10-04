import "server-only";
import { prisma } from "@/lib/db";
import {
  gradeWeekPicks,
  undoPickMembershipEffect,
  recomputeWeeksSurvived,
} from "@/lib/grading";
import { normAbbr } from "@/lib/espn";
import { syncTeamStandingsIfStale } from "@/lib/espn-standings";
import { scheduleScoreUpdate } from "@/lib/notification-events";
import { syncOddsFromEspnSnapshots } from "@/lib/espn-odds";
import {
  fetchEspnWeekScoreboard,
  freshScoreboardFetchedAt,
  scoreboardFetchedAt,
  type EspnGameSnapshot,
} from "@/lib/espn-scoreboard";
import { manualScoreRefreshShouldFetch } from "@/lib/live-refresh-gate";
import { resolveSlateWeek, slateRefresher } from "@/lib/slate-refresh";
import { enqueueWeekWork } from "@/lib/week-work-queue";

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

export type WeekScoreSyncOpts = {
  /** Pending finals → results. Default true for cron and the sync API. */
  grade?: boolean;
  /** ESPN W-L pull, capped by the Standings TTL. Default true; player tabs pass false. */
  standings?: boolean;
  /**
   * Scores Refresh only. Pull ESPN when the saved scoreboard is older than
   * this. Background polls omit it and keep the normal TTL.
   */
  maxAgeMs?: number;
};

/**
 * Pull ESPN scoreboard into the Game rows of the week that owns them.
 * Overwrites demo/fake live scores. Does not invent scores — scheduled clears them.
 * Call through `syncPoolWeekFromEspn`, which keys this by the slate owner's week.
 */
export async function syncWeekScoresFromEspn(
  weekId: string,
  opts: WeekScoreSyncOpts = {}
): Promise<{
  updated: number;
  live: number;
  final: number;
  scheduled: number;
  graded: string[];
  gradeRan: boolean;
  /** Games whose status flipped to final on this pull. */
  justFinished: number;
  /** True when this pull graded every pool that shares the slate. */
  gradedAllPools: boolean;
  standingsUpdated: number;
  /** Fetch time of the fresh scoreboard these rows came from; null after an ESPN failure. */
  scoreboardAt: number | null;
  source: "espn";
}> {
  const week = await prisma.week.findUniqueOrThrow({
    where: { id: weekId },
    include: { games: true, pool: true },
  });
  const seasonYear = Number(String(week.pool.season).slice(0, 4)) || 2026;
  const snapshots = await fetchEspnWeekScoreboard(week.number, seasonYear, opts.maxAgeMs);
  const scoreboardAt = freshScoreboardFetchedAt(week.number, seasonYear);
  const byMatch = new Map(
    snapshots.map((s) => [matchKey(s.awayAbbr, s.homeAbbr), s] as const)
  );

  let updated = 0;
  let live = 0;
  let final = 0;
  let scheduled = 0;
  let justFinished = 0;

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
    if (snap.status === "final" && game.status !== "final") justFinished += 1;

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

  const fullGrade = opts.grade !== false;
  let graded: string[] = [];
  let gradeRan = false;
  let gradedAllPools = false;
  if (fullGrade) {
    graded = await gradePoolWeek(weekId, week.poolId);
    gradeRan = true;
  } else if (justFinished > 0) {
    graded = await gradePoolsOnSlate(week.poolId, week.number);
    gradeRan = true;
    gradedAllPools = true;
  }

  const standingsUpdated =
    opts.standings === false ? 0 : await syncTeamStandingsIfStale();

  return {
    updated,
    live,
    final,
    scheduled,
    graded,
    gradeRan,
    justFinished,
    gradedAllPools,
    standingsUpdated,
    scoreboardAt,
    source: "espn",
  };
}

/** Grade one pool's week against whatever Game rows its picks point at. */
async function gradePoolWeek(weekId: string, poolId: string): Promise<string[]> {
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
  await recomputeWeeksSurvived(poolId);
  return graded;
}

/** Owner week plus every pool that borrows this slate, for one finish. */
async function gradePoolsOnSlate(poolId: string, weekNumber: number): Promise<string[]> {
  const pools = await prisma.pool.findMany({
    where: { OR: [{ id: poolId }, { slatePoolId: poolId }] },
    select: { id: true },
  });
  const weeks = await prisma.week.findMany({
    where: { number: weekNumber, poolId: { in: pools.map((pool) => pool.id) } },
    select: { id: true, poolId: true },
  });
  const graded: string[] = [];
  for (const row of weeks) {
    graded.push(...(await gradePoolWeek(row.id, row.poolId)));
  }
  return graded;
}

/**
 * Score sync for the week the viewer is in. Every caller (player tabs, the
 * live poll, cron, week wrap) comes through here so the ESPN → Game write is
 * keyed by the slate owner's Week: pools that borrow the slate share one write
 * per scoreboard fetch, then grade only their own picks.
 */
export async function syncPoolWeekFromEspn(
  viewerWeekId: string,
  opts: WeekScoreSyncOpts = {}
) {
  const target = await resolveSlateWeek(viewerWeekId);
  if (!target) throw new Error("Week not found");
  const grade = opts.grade !== false;
  const manualAge = opts.maxAgeMs;
  const pullLive =
    manualAge != null &&
    manualScoreRefreshShouldFetch(
      scoreboardFetchedAt(target.number, target.year),
      Date.now(),
      manualAge
    );
  const slate = await slateRefresher.run(target, () =>
    enqueueWeekWork(target.slateWeekId, () =>
      syncWeekScoresFromEspn(target.slateWeekId, {
        grade,
        standings: false,
        ...(manualAge != null ? { maxAgeMs: manualAge } : {}),
      })
    ),
    pullLive ? { force: true } : undefined
  );

  const justFinished = slate?.justFinished ?? 0;
  const graded = new Set(slate?.graded ?? []);
  if (grade && !slate?.gradedAllPools && (target.borrowed || !slate?.gradeRan)) {
    const own = await enqueueWeekWork(viewerWeekId, () =>
      gradePoolWeek(viewerWeekId, target.viewerPoolId)
    );
    for (const id of own) graded.add(id);
  }

  const standingsUpdated =
    opts.standings === false && justFinished === 0
      ? 0
      : await syncTeamStandingsIfStale();

  return {
    updated: slate?.updated ?? 0,
    live: slate?.live ?? 0,
    final: slate?.final ?? 0,
    scheduled: slate?.scheduled ?? 0,
    graded: [...graded],
    justFinished,
    standingsUpdated,
    slateWeekId: target.slateWeekId,
    borrowed: target.borrowed,
    /** False when the slate rows were already current and ESPN was not read. */
    slateRefreshed: slate !== null,
    source: "espn" as const,
  };
}

export { shouldPollLiveScores } from "@/lib/game-display";
