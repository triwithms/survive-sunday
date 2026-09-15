import "server-only";
import { fetchEspnJson, normAbbr } from "@/lib/espn";
import {
  countInjuries,
  parseEspnInjuries,
  type EspnInjuriesPayload,
  type InjuryCounts,
  type LiveInjury,
} from "@/lib/injury-parse";

export type {
  EspnInjuriesPayload,
  InjuryCounts,
  LiveInjury,
} from "@/lib/injury-parse";
export { countInjuries, parseEspnInjuries } from "@/lib/injury-parse";

export type TeamInjuriesResult = {
  injuries: LiveInjury[];
  counts: InjuryCounts;
  failed: boolean;
  fetchedAt: number | null;
  sourceLabel: string;
  espnInjuriesUrl: string;
  nflInjuriesUrl: string;
};

const INJURY_TTL_MS = 12 * 60 * 1000;
const INJURY_FAIL_TTL_MS = 45 * 1000;

type CacheEntry = {
  fetchedAt: number;
  failed: boolean;
  byTeam: Map<string, LiveInjury[]>;
};

let injuryCache: CacheEntry | null = null;

function groupByTeam(rows: LiveInjury[]): Map<string, LiveInjury[]> {
  const map = new Map<string, LiveInjury[]>();
  for (const row of rows) {
    const key = normAbbr(row.teamAbbr);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }
  return map;
}

async function loadInjuryCache(): Promise<CacheEntry> {
  const now = Date.now();
  if (injuryCache) {
    const ttl = injuryCache.failed ? INJURY_FAIL_TTL_MS : INJURY_TTL_MS;
    if (now - injuryCache.fetchedAt < ttl) return injuryCache;
    if (!injuryCache.failed && now - injuryCache.fetchedAt < INJURY_TTL_MS * 2) {
      // stale-while-revalidate: keep serving last good while refetching below
    }
  }

  try {
    const payload = await fetchEspnJson<EspnInjuriesPayload>(
      "/apis/site/v2/sports/football/nfl/injuries",
      { timeoutMs: 10000 }
    );
    const rows = parseEspnInjuries(payload);
    const entry: CacheEntry = {
      fetchedAt: now,
      failed: false,
      byTeam: groupByTeam(rows),
    };
    injuryCache = entry;
    return entry;
  } catch {
    if (injuryCache && !injuryCache.failed && injuryCache.byTeam.size > 0) {
      return injuryCache;
    }
    const entry: CacheEntry = {
      fetchedAt: now,
      failed: true,
      byTeam: new Map(),
    };
    injuryCache = entry;
    return entry;
  }
}

export async function getTeamInjuries(abbr: string): Promise<TeamInjuriesResult> {
  const key = normAbbr(abbr);
  const espn = key === "WAS" ? "wsh" : key.toLowerCase();
  const urls = {
    espnInjuriesUrl: `https://www.espn.com/nfl/team/injuries/_/name/${espn}`,
    nflInjuriesUrl: "https://www.nfl.com/injuries/",
  };
  const cache = await loadInjuryCache();
  const injuries = cache.byTeam.get(key) ?? [];
  return {
    injuries,
    counts: countInjuries(injuries),
    failed: cache.failed,
    fetchedAt: cache.fetchedAt,
    sourceLabel: "ESPN public injury report",
    ...urls,
  };
}
