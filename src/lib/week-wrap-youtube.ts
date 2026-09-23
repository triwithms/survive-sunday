/**
 * YouTube Data API search on the official NFL channel (@NFL).
 * Missing key, HTTP error, or no title match → null. Never throws.
 */

import { pickTouchdownClip, type TouchdownClip } from "./week-wrap-touchdown";
import { YT_NFL } from "./youtube-channels";

const ENDPOINT = "https://www.googleapis.com/youtube/v3/search";

export async function findWeekTouchdownVideo(
  weekNumber: number,
  opts?: { seasonYear?: number; apiKey?: string; fetchImpl?: typeof fetch }
): Promise<TouchdownClip | null> {
  if (!Number.isInteger(weekNumber) || weekNumber < 1) return null;
  const apiKey = (opts?.apiKey ?? process.env.YOUTUBE_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const url = new URL(ENDPOINT);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("channelId", YT_NFL);
  url.searchParams.set("q", `Every Touchdown of Week ${weekNumber}`);
  url.searchParams.set("type", "video");
  url.searchParams.set("order", "date");
  url.searchParams.set("maxResults", "10");
  url.searchParams.set("key", apiKey);
  const year = opts?.seasonYear;
  if (year && year >= 2000 && year <= 2100) {
    url.searchParams.set("publishedAfter", `${year}-08-01T00:00:00Z`);
  }
  try {
    const fetchImpl = opts?.fetchImpl ?? fetch;
    const res = await fetchImpl(url.toString(), {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn("[week-wrap] youtube search", res.status);
      return null;
    }
    return pickTouchdownClip(await res.json(), weekNumber);
  } catch (error) {
    console.warn("[week-wrap] youtube search failed", error);
    return null;
  }
}
