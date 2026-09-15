import "server-only";
import type { PrismaClient } from "@prisma/client";
import { fetchEspnJson } from "@/lib/espn";
import {
  emptyOdds,
  hasUsableOdds,
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
  /** Already parsed from the week scoreboard when ESPN included a line. */
  odds?: GameOdds | null;
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

async function writeOdds(
  db: PrismaClient,
  game: OddsGameRow,
  next: GameOdds
): Promise<boolean> {
  const odds = sanitizeGameOdds(next);
  if (!hasUsableOdds(odds) || !oddsChanged(game, odds)) return false;
  await db.game.update({
    where: { id: game.id },
    data: {
      spreadHome: odds.spreadHome,
      spreadAway: odds.spreadAway,
      mlHome: odds.mlHome,
      mlAway: odds.mlAway,
    },
  });
  game.spreadHome = odds.spreadHome;
  game.spreadAway = odds.spreadAway;
  game.mlHome = odds.mlHome;
  game.mlAway = odds.mlAway;
  return true;
}

/**
 * Fill Game spread/ML from the ESPN week scoreboard when it already has a line.
 * Per-game summary is only a fallback for still-blank rows (avoids 16 extra
 * ESPN calls that often time out before Schedule/Pick can show favourites).
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
  const working: OddsGameRow[] = [];
  for (const game of games) {
    if (!isPlaceholderOdds(game)) {
      working.push({ ...game });
      continue;
    }
    await db.game.update({
      where: { id: game.id },
      data: emptyOdds(),
    });
    updated += 1;
    working.push({
      ...game,
      ...emptyOdds(),
    });
  }

  for (const game of working) {
    const snap = byMatch.get(matchKey(game.awayAbbr, game.homeAbbr));
    if (!snap?.odds) continue;
    if (await writeOdds(db, game, snap.odds)) updated += 1;
  }

  const jobs: Array<{ game: OddsGameRow; eventId: string }> = [];
  for (const game of working) {
    if (game.spreadHome != null || game.spreadAway != null) continue;
    const snap = byMatch.get(matchKey(game.awayAbbr, game.homeAbbr));
    if (!snap?.eventId) continue;
    jobs.push({ game, eventId: snap.eventId });
  }
  if (jobs.length === 0) return { updated, fetched: 0 };

  const fetched = await mapPool(jobs, 4, async (job) => ({
    game: job.game,
    odds: await fetchEspnSummaryOdds(job.eventId),
  }));

  for (const row of fetched) {
    if (!row.odds) continue;
    if (await writeOdds(db, row.game, row.odds)) updated += 1;
  }
  return { updated, fetched: jobs.length };
}
