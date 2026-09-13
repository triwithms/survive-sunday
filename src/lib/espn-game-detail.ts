import "server-only";
import { fetchEspnJson } from "@/lib/espn";
import {
  buildEspnGameNote,
  fetchEspnWeekScoreboard,
} from "@/lib/live-scores";
import {
  parseEspnGameSummary,
  type GameDetailDto,
} from "@/lib/espn-game-detail-parse";

export type { GameDetailDto };

const SUMMARY_TTL_MS = 15_000;
const summaryCache = new Map<string, { at: number; data: unknown }>();

async function fetchEspnSummary(eventId: string): Promise<unknown> {
  const now = Date.now();
  const hit = summaryCache.get(eventId);
  if (hit && now - hit.at < SUMMARY_TTL_MS) return hit.data;
  const data = await fetchEspnJson<unknown>(
    `/apis/site/v2/sports/football/nfl/summary?event=${encodeURIComponent(eventId)}`
  );
  summaryCache.set(eventId, { at: now, data });
  return data;
}

export async function fetchEspnGameDetail(opts: {
  weekNumber: number;
  seasonYear: number;
  awayAbbr: string;
  homeAbbr: string;
}): Promise<GameDetailDto | null> {
  const snapshots = await fetchEspnWeekScoreboard(
    opts.weekNumber,
    opts.seasonYear
  );
  const snap = snapshots.find(
    (s) => s.awayAbbr === opts.awayAbbr && s.homeAbbr === opts.homeAbbr
  );
  if (!snap) return null;

  const note = buildEspnGameNote(snap);
  const base: GameDetailDto = {
    awayAbbr: snap.awayAbbr,
    homeAbbr: snap.homeAbbr,
    scoreAway: snap.scoreAway,
    scoreHome: snap.scoreHome,
    status: snap.status,
    note,
    timeoutsAway: snap.timeoutsAway,
    timeoutsHome: snap.timeoutsHome,
    scoringPlays: [],
    currentDrive: null,
    recentDrives: [],
    leaders: [],
  };

  if (!snap.eventId) return base;
  try {
    const raw = await fetchEspnSummary(snap.eventId);
    const parsed = parseEspnGameSummary(
      raw && typeof raw === "object" ? (raw as Parameters<typeof parseEspnGameSummary>[0]) : {}
    );
    return { ...base, ...parsed };
  } catch (e) {
    console.error("espn game summary skipped", e);
    return base;
  }
}
