import "server-only";
import { fetchEspnJson } from "@/lib/espn";
import {
  isLastGoodFresh,
  lastGoodServePlan,
  rememberLastGood,
  scoreboardTtlMs,
  type LastGoodEntry,
} from "@/lib/last-good-cache";
import {
  parseEspnScoreboard,
  scoreboardHasLive,
  slateFingerprint,
  type EspnGameSnapshot,
  type EspnScoreboardPayload,
} from "@/lib/espn-scoreboard-parse";
import {
  SCOREBOARD_FAIL_TTL_MS,
  SCOREBOARD_LIVE_TTL_MS,
  SCOREBOARD_SLATE_TTL_MS,
} from "@/lib/static-cache-ttl";

export type { EspnGameSnapshot };
export { slateFingerprint, scoreboardHasLive };

const byWeek = new Map<string, LastGoodEntry<EspnGameSnapshot[]>>();
const inflight = new Map<string, Promise<EspnGameSnapshot[]>>();

function weekKey(weekNumber: number, year: number): string {
  return `${year}-w${weekNumber}`;
}

function ttlFor(data: EspnGameSnapshot[], now = Date.now()): number {
  if (scoreboardHasLive(data)) return SCOREBOARD_LIVE_TTL_MS;
  const hour = 60 * 60 * 1000;
  const liveWindow = data.some((s) => {
    if (s.status === "final" || !s.kickoffIso) return false;
    const t = Date.parse(s.kickoffIso);
    return Number.isFinite(t) && t - 30 * 60 * 1000 <= now && now <= t + 4 * hour;
  });
  return scoreboardTtlMs(liveWindow, SCOREBOARD_LIVE_TTL_MS, SCOREBOARD_SLATE_TTL_MS);
}

export function isWeekScoreboardFresh(weekNumber: number, year = 2026, now = Date.now()): boolean {
  const hit = byWeek.get(weekKey(weekNumber, year));
  if (!hit) return false;
  return isLastGoodFresh(hit, now, ttlFor(hit.value, now));
}

/** In-memory last-good only — never fetches ESPN. */
export function peekCachedWeekScoreboard(
  weekNumber: number,
  year = 2026
): EspnGameSnapshot[] | null {
  const hit = byWeek.get(weekKey(weekNumber, year));
  if (!hit || hit.failed) return null;
  return hit.value;
}

async function loadWeekScoreboard(weekNumber: number, year: number): Promise<EspnGameSnapshot[]> {
  const key = weekKey(weekNumber, year);
  const now = Date.now();
  const hit = byWeek.get(key);
  const ttl = hit ? ttlFor(hit.value, now) : SCOREBOARD_SLATE_TTL_MS;
  const plan = lastGoodServePlan(hit, now, ttl, SCOREBOARD_FAIL_TTL_MS, ttl);
  if (plan === "fresh" && hit) return hit.value;
  if (plan === "fail-wait" && hit) return hit.value;

  const path = `/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week=${weekNumber}&year=${year}`;
  try {
    const payload = await fetchEspnJson<EspnScoreboardPayload>(path);
    const data = parseEspnScoreboard(payload);
    const next = rememberLastGood(hit, { value: data, hash: slateFingerprint(data), failed: false }, now, true);
    byWeek.set(key, next);
    return next.value;
  } catch (e) {
    if (hit && !hit.failed) {
      byWeek.set(key, rememberLastGood(hit, { value: hit.value, hash: hit.hash, failed: true }, now, true));
      return hit.value;
    }
    byWeek.set(key, rememberLastGood(hit, { value: [], hash: "", failed: true }, now, true));
    throw e;
  }
}

export async function fetchEspnWeekScoreboard(weekNumber: number, year = 2026): Promise<EspnGameSnapshot[]> {
  const key = weekKey(weekNumber, year);
  const pending = inflight.get(key);
  if (pending) return pending;
  const job = loadWeekScoreboard(weekNumber, year).finally(() => inflight.delete(key));
  inflight.set(key, job);
  return job;
}
