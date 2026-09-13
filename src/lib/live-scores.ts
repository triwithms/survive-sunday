import "server-only";
import { prisma } from "@/lib/db";
import {
  gradeWeekPicks,
  undoPickMembershipEffect,
  recomputeWeeksSurvived,
} from "@/lib/grading";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

/** ESPN → app team abbreviation. */
export function fromEspnAbbr(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  return u === "WSH" ? "WAS" : u;
}

export type EspnGameSnapshot = {
  awayAbbr: string;
  homeAbbr: string;
  status: "scheduled" | "live" | "final";
  scoreAway: number | null;
  scoreHome: number | null;
  clockLabel: string | null;
  detail: string | null;
};

type EspnCompetitor = {
  homeAway: string;
  score?: string;
  team: { abbreviation: string };
};

type EspnEvent = {
  competitions?: Array<{
    competitors?: EspnCompetitor[];
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

export async function fetchEspnWeekScoreboard(
  weekNumber: number,
  year = 2026
): Promise<EspnGameSnapshot[]> {
  const url = `${ESPN_SCOREBOARD}?seasontype=2&week=${weekNumber}&year=${year}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "SurviveSunday/1.0" },
    next: { revalidate: 0 },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESPN scoreboard ${res.status}`);
  }
  const data = (await res.json()) as { events?: EspnEvent[] };
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
    const scoreAway =
      away.score != null && away.score !== "" ? Number(away.score) : null;
    const scoreHome =
      home.score != null && home.score !== "" ? Number(home.score) : null;
    out.push({
      awayAbbr: fromEspnAbbr(away.team.abbreviation),
      homeAbbr: fromEspnAbbr(home.team.abbreviation),
      status,
      scoreAway: Number.isFinite(scoreAway as number) ? scoreAway : null,
      scoreHome: Number.isFinite(scoreHome as number) ? scoreHome : null,
      clockLabel: periodClock(
        statusObj?.period,
        statusObj?.displayClock,
        type?.shortDetail,
        status
      ),
      detail: type?.detail || type?.shortDetail || null,
    });
  }
  return out;
}

function matchKey(away: string, home: string) {
  return `${away}@${home}`;
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

    const note =
      snap.status === "live"
        ? snap.clockLabel
          ? `${snap.clockLabel} · ESPN`
          : "Live · ESPN"
        : snap.status === "final"
          ? snap.clockLabel || "Final · ESPN"
          : snap.clockLabel
            ? `${snap.clockLabel} · ESPN`
            : null;

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

  return {
    updated,
    live,
    final,
    scheduled,
    graded,
    source: "espn",
  };
}

/** True when Scores should keep polling ESPN (live window). */
export function shouldPollLiveScores(
  games: { status: string; kickoff: Date }[],
  now = Date.now()
): boolean {
  if (games.some((g) => g.status === "live")) return true;
  const hour = 60 * 60 * 1000;
  return games.some((g) => {
    if (g.status === "final") return false;
    const t = new Date(g.kickoff).getTime();
    // 30m before kickoff through 4h after (covers most games)
    return t - 30 * 60 * 1000 <= now && now <= t + 4 * hour;
  });
}
