import "server-only";

/**
 * ESPN public site JSON (undocumented). Used only for this private friends PWA.
 * Prefer site.web.api — site.api is often 403 from datacenter IPs.
 * No official SLA. Not for commercial redistribution.
 */
export const ESPN_SITE_HOSTS = [
  "https://site.web.api.espn.com",
  "https://site.api.espn.com",
] as const;

/** Browser-like headers — ESPN edge 403s many bot User-Agents. */
export const ESPN_BROWSER_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Referer: "https://www.espn.com/nfl/",
  "Accept-Language": "en-CA,en;q=0.9",
};

/** App abbr (WAS) → ESPN team id. */
export const ESPN_TEAM_IDS: Record<string, string> = {
  ARI: "22",
  ATL: "1",
  BAL: "33",
  BUF: "2",
  CAR: "29",
  CHI: "3",
  CIN: "4",
  CLE: "5",
  DAL: "6",
  DEN: "7",
  DET: "8",
  GB: "9",
  HOU: "34",
  IND: "11",
  JAX: "30",
  KC: "12",
  LV: "13",
  LAC: "24",
  LAR: "14",
  MIA: "15",
  MIN: "16",
  NE: "17",
  NO: "18",
  NYG: "19",
  NYJ: "20",
  PHI: "21",
  PIT: "23",
  SF: "25",
  SEA: "26",
  TB: "27",
  TEN: "10",
  WAS: "28",
};

const ESPN_ID_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(ESPN_TEAM_IDS).map(([abbr, id]) => [id, abbr])
);

export function normAbbr(abbr: string): string {
  const u = abbr.trim().toUpperCase();
  return u === "WSH" ? "WAS" : u;
}

/** App abbr (WAS) → ESPN site abbreviation (WSH). */
export function espnAbbr(abbr: string): string {
  const key = normAbbr(abbr);
  return key === "WAS" ? "WSH" : key;
}

export function abbrFromEspnTeamId(
  id: string | number | null | undefined
): string | null {
  if (id == null || id === "") return null;
  return ESPN_ID_TO_ABBR[String(id)] ?? null;
}

export async function fetchEspnJson<T>(
  pathWithQuery: string,
  opts?: { timeoutMs?: number }
): Promise<T> {
  let lastError: Error | null = null;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  for (const host of ESPN_SITE_HOSTS) {
    const url = `${host}${pathWithQuery}`;
    try {
      const res = await fetch(url, {
        headers: ESPN_BROWSER_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        lastError = new Error(`ESPN ${res.status} ${host}`);
        continue;
      }
      return (await res.json()) as T;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastError ?? new Error("ESPN fetch failed");
}
