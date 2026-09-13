import "server-only";
import { ESPN_TEAM_IDS, abbrFromEspnTeamId, espnAbbr, normAbbr } from "@/lib/espn-teams";

export { ESPN_TEAM_IDS, abbrFromEspnTeamId, espnAbbr, normAbbr };

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
