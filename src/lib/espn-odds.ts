import "server-only";
import type { PrismaClient } from "@prisma/client";
import { fetchEspnJson } from "@/lib/espn";
import {
  emptyOdds,
  isPlaceholderOdds,
  parseEspnSummaryOdds,
  sanitizeGameOdds,
  type GameOdds,
} from "@/lib/odds";

const ODDS_TTL_MS = 15 * 60 * 1000;

type CacheEntry = { at: number; odds: GameOdds | null };
const oddsByEvent = new Map<string, CacheEntry>();

export type OddsGameRow = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  status?: string;
};

export type OddsSnapshot = {
  eventId: string | null;
  awayAbbr: string;
  homeAbbr: string;
};

function matchKey(away: string, home: string) {
  return `${away}@${home}`;
}

function oddsChanged(row: OddsGameRow, next: GameOdds): boolean {
  return (
    row.spreadHome !== next.spreadHome ||
    row.spreadAway !== next.spreadAway ||
    row.mlHome !== next.mlHome ||
    row.mlAway !== next.mlAway
  );
}

async function fetchEspnSummaryOdds(eventId: string): Promise<GameOdds | null> {
  const now = Date.now();
  const hit = oddsByEvent.get(eventId);
  if (hit && now - hit.at < ODDS_TTL_MS) return hit.odds;
  try {
    const data = await fetchEspnJson<{
      pickcenter?: unknown;
      odds?: unknown;
    }>(
      `/apis/site/v2/sports/football/nfl/summary?event=${encodeURIComponent(eventId)}`,
      { timeoutMs: 5000 }
    );
    const odds = parseEspnSummaryOdds(data);
    oddsByEvent.set(eventId, { at: now, odds });
    return odds;
  } catch (e) {
    console.error("espn odds summary skipped", eventId, e);
    oddsByEvent.set(eventId, { at: now, odds: null });
    return null;
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const idx = next;
      next += 1;
      out[idx] = await fn(items[idx]);
    }
  }
  const n = Math.min(Math.max(1, limit), items.length);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/**
 * Fill Game spread/ML from ESPN pickcenter when the scoreboard has an event id.
 * Placeholder fake -3 rows are cleared first. ESPN failures stay blank.
 */
export async function syncOddsFromEspnSnapshots(
  db: PrismaClient,
  games: OddsGameRow[],
  snapshots: OddsSnapshot[]
): Promise<{ updated: number; fetched: number }> {
  const byMatch = new Map(
    snapshots.map((s) => [matchKey(s.awayAbbr, s.homeAbbr), s] as const)
  );

  let updated = 0;
  const cleared: OddsGameRow[] = [];
  for (const game of games) {
    if (!isPlaceholderOdds(game)) {
      cleared.push(game);
      continue;
    }
    await db.game.update({
      where: { id: game.id },
      data: emptyOdds(),
    });
    updated += 1;
    cleared.push({
      ...game,
      ...emptyOdds(),
    });
  }

  const now = Date.now();
  const jobs: Array<{ game: OddsGameRow; eventId: string }> = [];
  for (const game of cleared) {
    const snap = byMatch.get(matchKey(game.awayAbbr, game.homeAbbr));
    if (!snap?.eventId) continue;
    const missing = game.spreadHome == null && game.spreadAway == null;
    const upcoming = game.status === "scheduled";
    const hit = oddsByEvent.get(snap.eventId);
    const cacheFresh = Boolean(hit && now - hit.at < ODDS_TTL_MS);
    if (!missing && (!upcoming || cacheFresh)) continue;
    jobs.push({ game, eventId: snap.eventId });
  }
  if (jobs.length === 0) return { updated, fetched: 0 };

  const fetched = await mapPool(jobs, 4, async (job) => ({
    game: job.game,
    odds: await fetchEspnSummaryOdds(job.eventId),
  }));

  for (const row of fetched) {
    if (!row.odds) continue;
    const next = sanitizeGameOdds(row.odds);
    if (
      next.spreadHome == null &&
      next.spreadAway == null &&
      next.mlHome == null &&
      next.mlAway == null
    ) {
      continue;
    }
    if (!oddsChanged(row.game, next)) continue;
    await db.game.update({
      where: { id: row.game.id },
      data: {
        spreadHome: next.spreadHome,
        spreadAway: next.spreadAway,
        mlHome: next.mlHome,
        mlAway: next.mlAway,
      },
    });
    updated += 1;
  }
  return { updated, fetched: jobs.length };
}
