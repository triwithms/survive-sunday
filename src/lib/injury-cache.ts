import "server-only";
import { fetchEspnJson, normAbbr } from "@/lib/espn";
import {
  parseEspnInjuries,
  type EspnInjuriesPayload,
  type LiveInjury,
} from "@/lib/injury-parse";
import { injuryFingerprint } from "@/lib/injury-hash";
import {
  lastGoodServePlan,
  rememberLastGood,
  type LastGoodEntry,
} from "@/lib/last-good-cache";
import { INJURY_FAIL_TTL_MS, INJURY_SWR_MS, INJURY_TTL_MS } from "@/lib/static-cache-ttl";

export type InjuryCacheValue = {
  byTeam: Map<string, LiveInjury[]>;
  rows: LiveInjury[];
};

let injuryCache: LastGoodEntry<InjuryCacheValue> | null = null;
let inflight: Promise<LastGoodEntry<InjuryCacheValue>> | null = null;

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

async function refreshInjuries(): Promise<LastGoodEntry<InjuryCacheValue>> {
  const now = Date.now();
  try {
    const payload = await fetchEspnJson<EspnInjuriesPayload>(
      "/apis/site/v2/sports/football/nfl/injuries",
      { timeoutMs: 10000 }
    );
    const rows = parseEspnInjuries(payload);
    const incoming = {
      value: { byTeam: groupByTeam(rows), rows },
      hash: injuryFingerprint(rows),
      failed: false,
    };
    injuryCache = rememberLastGood(injuryCache, incoming, now);
    return injuryCache;
  } catch {
    const empty = { byTeam: new Map<string, LiveInjury[]>(), rows: [] as LiveInjury[] };
    injuryCache = rememberLastGood(
      injuryCache,
      { value: empty, hash: injuryCache?.hash ?? "", failed: true },
      now
    );
    return injuryCache;
  }
}

export async function loadInjuryCache(): Promise<LastGoodEntry<InjuryCacheValue>> {
  const plan = lastGoodServePlan(injuryCache, Date.now(), INJURY_TTL_MS, INJURY_FAIL_TTL_MS, INJURY_SWR_MS);
  if ((plan === "fresh" || plan === "fail-wait") && injuryCache) return injuryCache;
  if (plan === "swr" && injuryCache && !injuryCache.failed) {
    if (!inflight) inflight = refreshInjuries().finally(() => { inflight = null; });
    return injuryCache;
  }
  if (!inflight) inflight = refreshInjuries().finally(() => { inflight = null; });
  return inflight;
}
