import "server-only";
import { prisma } from "@/lib/db";
import {
  gradeWeekPicks,
  undoPickMembershipEffect,
  recomputeWeeksSurvived,
} from "@/lib/grading";
import { fetchEspnJson, normAbbr } from "@/lib/espn";
import { syncTeamStandingsFromEspn } from "@/lib/espn-standings";
import { scheduleScoreUpdate } from "@/lib/notification-events";
import { formatEspnSituation } from "@/lib/game-display";
import { syncOddsFromEspnSnapshots } from "@/lib/espn-odds";
import { parseEspnCompetitionOdds, type GameOdds } from "@/lib/odds";

/** ESPN → app team abbreviation. */
export function fromEspnAbbr(abbr: string): string {
  return normAbbr(abbr);
}

export type EspnGameSnapshot = {
  eventId: string | null;
  awayAbbr: string;
  homeAbbr: string;
  status: "scheduled" | "live" | "final";
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel: string | null;
  situationLabel: string | null;
  timeoutsAway: number | null;
  timeoutsHome: number | null;
  detail: string | null;
  odds: GameOdds | null;
};

type EspnCompetitor = {
  homeAway: string;
  score?: string;
  team: { abbreviation: string };
};

type EspnSituation = {
  possession?: string;
  shortDownDistanceText?: string;
  possessionText?: string;
  downDistanceText?: string;
  down?: number;
  distance?: number;
  homeTimeouts?: number;
  awayTimeouts?: number;
};

type EspnEvent = {
  id?: string;
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    odds?: unknown;
    situation?: EspnSituation;
    status?: {
      displayClock?: string;
      period?: number;
      type?: {
        name?: string;
        state?: string;
        shortDetail?: string;
        detail?: string;
        completed?: boolean;
      };
    };
  }>;
  status?: {
    displayClock?: string;
    period?: number;
    type?: {
      name?: string;
      state?: string;
      shortDetail?: string;
      detail?: string;
      completed?: boolean;
    };
  };
};

function mapEspnStatus(
  state: string | undefined,
  name: string | undefined
): "scheduled" | "live" | "final" {
  const s = (state || "").toLowerCase();
  const n = (name || "").toUpperCase();
  if (s === "post" || n.includes("FINAL")) return "final";
  if (s === "in" || n.includes("IN_PROGRESS") || n.includes("HALFTIME") || n.includes("END_PERIOD"))
    return "live";
  return "scheduled";
}

function periodClock(
  period: number | undefined,
  displayClock: string | undefined,
  shortDetail: string | undefined,
  status: "scheduled" | "live" | "final"
): string | null {
  if (status === "final") return shortDetail || "Final";
  if (status === "scheduled") return shortDetail || null;
  if (shortDetail && /Q|Half|OT|END/i.test(shortDetail)) return shortDetail;
  if (period && displayClock) {
    const q = period > 4 ? `OT${period - 4}` : `Q${period}`;
    return `${q} ${displayClock}`;
  }
  return shortDetail || null;
}

const SCOREBOARD_TTL_MS = 20_000;
let scoreboardCache: {
  key: string;
  at: number;
  data: EspnGameSnapshot[];
} | null = null;

export async function fetchEspnWeekScoreboard(
  weekNumber: number,
  year = 2026
): Promise<EspnGameSnapshot[]> {
  const key = `${year}-w${weekNumber}`;
  const now = Date.now();
  if (
    scoreboardCache &&
    scoreboardCache.key === key &&
    now - scoreboardCache.at < SCOREBOARD_TTL_MS
  ) {
    return scoreboardCache.data;
  }

  const data = await fetchEspnJson<{ events?: EspnEvent[] }>(
    `/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${weekNumber}&year=${year}`
  );
  const out: EspnGameSnapshot[] = [];
  for (const event of data.events || []) {
    const comp = event.competitions?.[0];
    const statusObj = comp?.status || event.status;
    const type = statusObj?.type;
    const status = mapEspnStatus(type?.state, type?.name);
    const by = new Map(
      (comp?.competitors || []).map((c) => [c.homeAway, c] as const)
    );
    const away = by.get("away");
    const home = by.get("home");
    if (!away || !home) continue;
    const awayAbbr = fromEspnAbbr(away.team.abbreviation);
    const homeAbbr = fromEspnAbbr(home.team.abbreviation);
    const scoreAway =
      away.score != null && away.score !== "" ? Number(away.score) : null;
    const scoreHome =
      home.score != null && home.score !== "" ? Number(home.score) : null;
    const timeoutsAway =
      typeof comp?.situation?.awayTimeouts === "number"
        ? comp.situation.awayTimeouts
        : null;
    const timeoutsHome =
      typeof comp?.situation?.homeTimeouts === "number"
        ? comp.situation.homeTimeouts
        : null;
    out.push({
      eventId: event.id ? String(event.id) : null,
      awayAbbr,
      homeAbbr,
      status,
      scoreAway: Number.isFinite(scoreAway as number) ? scoreAway : null,
      scoreHome: Number.isFinite(scoreHome as number) ? scoreHome : null,
      clockLabel: periodClock(
        statusObj?.period,
        statusObj?.displayClock,
        type?.shortDetail,
        status
      ),
      situationLabel:
        status === "live" ? formatEspnSituation(comp?.situation) : null,
      timeoutsAway,
      timeoutsHome,
      detail: type?.detail || type?.shortDetail || null,
      odds: parseEspnCompetitionOdds(comp?.odds, homeAbbr, awayAbbr),
    });
  }
  scoreboardCache = { key, at: now, data: out };
  return out;
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
