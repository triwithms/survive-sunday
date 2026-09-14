import "server-only";
import {
  channelBlocksWebsiteEmbeds,
  leagueRssChannelIds,
} from "@/lib/youtube-channels";
import { teamMeta } from "@/lib/nfl-team-meta";
import {
  extractInnertubeVideos,
  groupWeeklyVideos,
  parseYoutubeAtomFeed,
  pickGameHighlights,
  withEmbeddableFlag,
  youtubeSearchUrl,
  type RawYoutubeHit,
  type VideoClip,
  type VideoGroups,
} from "@/lib/youtube-parse";

const YT_HEADERS: HeadersInit = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept-Language": "en-CA,en;q=0.9",
};

const RSS_TTL_MS = 10 * 60_000;
const SEARCH_TTL_MS = 8 * 60_000;
const EMBED_TTL_MS = 60 * 60_000;
const FETCH_MS = 7000;
const EMBED_PROBE_MS = 2500;

type CacheEntry<T> = { at: number; data: T };
const rssCache = new Map<string, CacheEntry<RawYoutubeHit[]>>();
const searchCache = new Map<string, CacheEntry<RawYoutubeHit[]>>();
const embedCache = new Map<string, CacheEntry<boolean | null>>();

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_MS),
    headers: YT_HEADERS,
    ...init,
  });
  if (!res.ok) throw new Error(`YouTube ${res.status}`);
  return res.text();
}

async function fetchRssChannel(channelId: string): Promise<RawYoutubeHit[]> {
  const now = Date.now();
  const hit = rssCache.get(channelId);
  if (hit && now - hit.at < RSS_TTL_MS) return hit.data;
  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  );
  const data = parseYoutubeAtomFeed(xml).map((row) => ({
    ...row,
    channelId: row.channelId || channelId,
  }));
  rssCache.set(channelId, { at: now, data });
  return data;
}

async function searchInnertube(query: string): Promise<RawYoutubeHit[]> {
  const now = Date.now();
  const cached = searchCache.get(query);
  if (cached && now - cached.at < SEARCH_TTL_MS) return cached.data;
  const body = JSON.stringify({
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20260901.00.00",
        hl: "en",
        gl: "CA",
      },
    },
    query,
    params: "EgIQAQ==",
  });
  const res = await fetch(
    "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
    {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_MS),
      headers: {
        ...YT_HEADERS,
        "Content-Type": "application/json",
        "X-YouTube-Client-Name": "1",
        "X-YouTube-Client-Version": "2.20260901.00.00",
      },
      body,
    }
  );
  if (!res.ok) throw new Error(`YouTube search ${res.status}`);
  const json: unknown = await res.json();
  const data = extractInnertubeVideos(json);
  searchCache.set(query, { at: now, data });
  return data;
}

async function settledHits(
  jobs: Array<Promise<RawYoutubeHit[]>>
): Promise<{ hits: RawYoutubeHit[]; anyOk: boolean }> {
  const results = await Promise.allSettled(jobs);
  const hits: RawYoutubeHit[] = [];
  let anyOk = false;
  for (const row of results) {
    if (row.status === "fulfilled") {
      anyOk = true;
      hits.push(...row.value);
    } else {
      console.error("youtube fetch skipped", row.reason);
    }
  }
  return { hits, anyOk };
}

/**
 * Innertube player `playableInEmbed`. oEmbed 200 is NOT a valid check —
 * NFL videos still return oEmbed while blocking website iframes (emb_err).
 * Probe failure → null (caller keeps the channel default).
 */
async function probePlayableInEmbed(videoId: string): Promise<boolean | null> {
  const now = Date.now();
  const cached = embedCache.get(videoId);
  if (cached && now - cached.at < EMBED_TTL_MS) return cached.data;
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(EMBED_PROBE_MS),
        headers: {
          ...YT_HEADERS,
          "Content-Type": "application/json",
          "X-YouTube-Client-Name": "1",
          "X-YouTube-Client-Version": "2.20260901.00.00",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20260901.00.00",
              hl: "en",
              gl: "CA",
            },
          },
          videoId,
        }),
      }
    );
    if (!res.ok) {
      embedCache.set(videoId, { at: now, data: null });
      return null;
    }
    const json = (await res.json()) as {
      videoDetails?: { playableInEmbed?: boolean };
      playabilityStatus?: { status?: string };
    };
    let embeddable: boolean | null = null;
    if (typeof json.videoDetails?.playableInEmbed === "boolean") {
      embeddable = json.videoDetails.playableInEmbed;
    } else {
      const status = json.playabilityStatus?.status;
      if (status === "UNPLAYABLE" || status === "ERROR" || status === "LOGIN_REQUIRED") {
        embeddable = false;
      }
    }
    embedCache.set(videoId, { at: now, data: embeddable });
    return embeddable;
  } catch (e) {
    console.error("youtube embed probe skipped", videoId, e);
    embedCache.set(videoId, { at: now, data: null });
    return null;
  }
}

async function withProbedEmbeddable(clips: VideoClip[]): Promise<VideoClip[]> {
  return Promise.all(
    clips.map(async (clip) => {
      if (channelBlocksWebsiteEmbeds(clip.channelId)) {
        return withEmbeddableFlag(clip, false);
      }
      if (!clip.embeddable) return clip;
      const probed = await probePlayableInEmbed(clip.id);
      if (probed === false) return withEmbeddableFlag(clip, false);
      if (probed === true) return withEmbeddableFlag(clip, true);
      return clip;
    })
  );
}

async function withProbedGroups(groups: VideoGroups): Promise<VideoGroups> {
  const [short, medium, long] = await Promise.all([
    withProbedEmbeddable(groups.short),
    withProbedEmbeddable(groups.medium),
    withProbedEmbeddable(groups.long),
  ]);
  return { short, medium, long };
}

export type WeeklyVideosResult = {
  ok: true;
  week: number;
  groups: VideoGroups;
  unavailable: boolean;
  nflChannelUrl: string;
};

export async function loadWeeklyVideos(week: number): Promise<WeeklyVideosResult> {
  const empty: VideoGroups = { short: [], medium: [], long: [] };
  if (!Number.isInteger(week) || week < 1 || week > 18) {
    return {
      ok: true,
      week,
      groups: empty,
      unavailable: false,
      nflChannelUrl: "https://www.youtube.com/@NFL",
    };
  }
  try {
    const { hits, anyOk } = await settledHits([
      ...leagueRssChannelIds().map((id) => fetchRssChannel(id)),
      searchInnertube(`NFL Week ${week} Preview 2026`),
      searchInnertube(`NFL Week ${week} Preview`),
      searchInnertube(`NFL Week ${week} Game Previews`),
      searchInnertube(`NFL Week ${week} Recap 2026`),
      searchInnertube(`NFL 2026 Season Week ${week} Highlights`),
      searchInnertube(`NFL Week ${week} Game Highlights 2026`),
      searchInnertube(`Good Morning Football Week ${week}`),
    ]);
    return {
      ok: true,
      week,
      groups: await withProbedGroups(groupWeeklyVideos(hits, week)),
      unavailable: !anyOk,
      nflChannelUrl: "https://www.youtube.com/@NFL",
    };
  } catch (e) {
    console.error("weekly videos failed", e);
    return {
      ok: true,
      week,
      groups: empty,
      unavailable: true,
      nflChannelUrl: "https://www.youtube.com/@NFL",
    };
  }
}

export type GameVideosResult = {
  ok: true;
  videos: VideoClip[];
  unavailable: boolean;
  searchUrl: string;
};

export async function loadGameVideos(opts: {
  week: number;
  awayAbbr: string;
  homeAbbr: string;
}): Promise<GameVideosResult> {
  const away = teamMeta(opts.awayAbbr);
  const home = teamMeta(opts.homeAbbr);
  const searchQ = away && home
    ? `${away.name} vs ${home.name} Week ${opts.week} Highlights 2026`
    : `${opts.awayAbbr} vs ${opts.homeAbbr} Week ${opts.week} Highlights NFL`;
  const searchUrl = youtubeSearchUrl(searchQ);
  try {
    const nickQ =
      away && home
        ? `${away.nickname} vs ${home.nickname} Week ${opts.week} Game Highlights`
        : searchQ;
    const { hits, anyOk } = await settledHits([
      ...leagueRssChannelIds().map((id) => fetchRssChannel(id)),
      searchInnertube(searchQ),
      searchInnertube(nickQ),
    ]);
    return {
      ok: true,
      videos: await withProbedEmbeddable(pickGameHighlights(hits, opts)),
      unavailable: !anyOk,
      searchUrl,
    };
  } catch (e) {
    console.error("game videos failed", e);
    return { ok: true, videos: [], unavailable: true, searchUrl };
  }
}
