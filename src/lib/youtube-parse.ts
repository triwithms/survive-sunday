import { teamMeta, type NflTeamMeta } from "@/lib/nfl-team-meta";
import {
  channelBlocksWebsiteEmbeds,
  channelLabel,
  channelRank,
  isAllowlistedChannel,
} from "@/lib/youtube-channels";

export type VideoBucket = "short" | "medium" | "long";

export type VideoClip = {
  id: string;
  title: string;
  channel: string;
  channelId: string | null;
  thumbnailUrl: string;
  publishedAt: string | null;
  durationSeconds: number | null;
  durationLabel: string | null;
  bucket: VideoBucket;
  watchUrl: string;
  embedUrl: string;
  /** False = never mount an iframe; thumbnail + Watch on YouTube only. */
  embeddable: boolean;
};

export type VideoGroups = {
  short: VideoClip[];
  medium: VideoClip[];
  long: VideoClip[];
};

export type RawYoutubeHit = {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  /** Innertube relative line, e.g. "3 days ago". */
  publishedLabel: string | null;
  durationSeconds: number | null;
  durationLabel: string | null;
  isShort: boolean;
  /** Innertube player `videoDetails.playableInEmbed` when known. */
  playableInEmbed?: boolean | null;
};

const SHORT_MIN_S = 90;
const SHORT_MAX_S = 10 * 60;
const MEDIUM_MAX_S = 20 * 60;
const LONG_MAX_S = 150 * 60;

/** 2026/27 regular season (this pool). Not preseason archives. */
export const THIS_NFL_SEASON_LABEL = "2026/27";
const THIS_SEASON = /\b2026(?:\s*[/\u2013-]\s*2?7)?\b/;
const OTHER_SEASON = /\b(201\d|202[0-5]|202[7-9]|20[3-9]\d)\b/;
const ARCHIVE_TITLE =
  /\b(throwback|nfl vault|from the archives?|this day in|classic highlights?|flashback)\b/i;

/** Regular season window: 1 Sep 2026 → 1 Mar 2027 (UTC). */
export const THIS_SEASON_START_MS = Date.UTC(2026, 8, 1);
export const THIS_SEASON_END_MS = Date.UTC(2027, 2, 1);

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
}

export function youtubeEmbedUrl(id: string): string {
  const q = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    fs: "1",
    controls: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${q}`;
}

/**
 * Only true when the source actually allows website embeds.
 * NFL / NFL Films / NFL Network always false. Unknown → false (link-out first)
 * unless the channel is a known-allow source (ESPN, TSN, team channels).
 */
export function clipAllowsWebsiteEmbed(hit: {
  channelId: string | null | undefined;
  playableInEmbed?: boolean | null;
}): boolean {
  if (hit.playableInEmbed === false) return false;
  if (channelBlocksWebsiteEmbeds(hit.channelId)) return false;
  if (hit.playableInEmbed === true) return true;
  if (!hit.channelId) return false;
  return !channelBlocksWebsiteEmbeds(hit.channelId);
}

export function youtubeThumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function parseDurationLabel(label: string | null | undefined): number | null {
  if (!label) return null;
  const parts = label
    .trim()
    .split(":")
    .map((p) => Number(p));
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

export function formatDurationLabel(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function bucketFromDuration(seconds: number | null): VideoBucket | null {
  if (seconds == null) return null;
  if (seconds < SHORT_MIN_S || seconds > LONG_MAX_S) return null;
  if (seconds < SHORT_MAX_S) return "short";
  if (seconds < MEDIUM_MAX_S) return "medium";
  return "long";
}

const SHORT_TITLE =
  /\b(highlights?|best plays?|can'?t-?miss|condensed|top plays?|in :?\d{1,2}|one play)\b/i;
const MEDIUM_TITLE =
  /\b(preview|recap|matchup|what to watch|gameday|around the nfl|week in review)\b/i;
const LONG_TITLE =
  /\b(films|full episode|press conference|hard knocks|all or nothing|every touchdown|game in \d+|a football life|mic'?d up)\b/i;

export function bucketFromTitle(title: string): VideoBucket {
  if (LONG_TITLE.test(title)) return "long";
  if (MEDIUM_TITLE.test(title) && !SHORT_TITLE.test(title)) return "medium";
  if (SHORT_TITLE.test(title)) return "short";
  return "medium";
}

export function resolveBucket(hit: {
  title: string;
  durationSeconds: number | null;
}): VideoBucket | null {
  const fromDur = bucketFromDuration(hit.durationSeconds);
  if (fromDur) return fromDur;
  if (hit.durationSeconds != null) return null;
  return bucketFromTitle(hit.title);
}

export function titleHasWeek(title: string, week: number): boolean {
  if (!Number.isInteger(week) || week < 1) return false;
  const re = new RegExp(`\\b(?:week|wk)\\s*0*${week}\\b`, "i");
  return re.test(title);
}

export function titleHasThisSeason(title: string): boolean {
  return THIS_SEASON.test(title);
}

export function titleLooksOldSeason(title: string): boolean {
  if (titleHasThisSeason(title)) return false;
  return OTHER_SEASON.test(title);
}

export function parseRelativePublishedMs(
  label: string | null | undefined,
  nowMs = Date.now()
): number | null {
  if (!label) return null;
  const t = label.trim().toLowerCase();
  if (!t) return null;
  if (/\btoday\b/.test(t) || /\bminutes? ago\b/.test(t) || /\bseconds? ago\b/.test(t)) {
    return nowMs;
  }
  if (/\byesterday\b/.test(t)) return nowMs - 24 * 60 * 60 * 1000;
  const m = t.match(
    /(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/
  );
  if (!m) {
    if (/\bhours? ago\b/.test(t)) return nowMs - 60 * 60 * 1000;
    if (/\bdays? ago\b/.test(t)) return nowMs - 24 * 60 * 60 * 1000;
    return null;
  }
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = m[2];
  const ms: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  return nowMs - n * (ms[unit] ?? 0);
}

export function timestampInThisSeason(ms: number | null | undefined): boolean {
  if (ms == null || !Number.isFinite(ms)) return false;
  return ms >= THIS_SEASON_START_MS && ms < THIS_SEASON_END_MS;
}

/**
 * Keep 2026/27 clips only. Old years in the title, archive wording, or no
 * season evidence (no 2026 + no publish date in this regular season) are out.
 */
export function clipIsThisNflSeason(
  hit: Pick<RawYoutubeHit, "title" | "publishedAt" | "publishedLabel">,
  nowMs = Date.now()
): boolean {
  const title = hit.title || "";
  if (ARCHIVE_TITLE.test(title)) return false;
  if (titleLooksOldSeason(title)) return false;
  if (titleHasThisSeason(title)) return true;
  if (timestampInThisSeason(Date.parse(hit.publishedAt || ""))) return true;
  return timestampInThisSeason(parseRelativePublishedMs(hit.publishedLabel, nowMs));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function titleMentionsTeam(
  title: string,
  team: NflTeamMeta | string
): boolean {
  const meta = typeof team === "string" ? teamMeta(team) : team;
  if (!meta) return false;
  const hay = title.toLowerCase();
  return meta.aliases.some((alias) => {
    const re = new RegExp(`\\b${escapeRegExp(alias.toLowerCase())}\\b`, "i");
    return re.test(hay);
  });
}

export function titleMatchesGame(
  title: string,
  awayAbbr: string,
  homeAbbr: string
): boolean {
  const away = teamMeta(awayAbbr);
  const home = teamMeta(homeAbbr);
  if (away && home && titleMentionsTeam(title, away) && titleMentionsTeam(title, home)) {
    return true;
  }
  return titleHasAbbrMatchup(title, awayAbbr, homeAbbr);
}

/** "#DENvsKC" / "DEN at KC" style titles from team channels. */
export function titleHasAbbrMatchup(
  title: string,
  awayAbbr: string,
  homeAbbr: string
): boolean {
  const compact = title.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (!compact) return false;
  const a = awayAbbr.replace(/[^a-z0-9]/gi, "").toLowerCase();
  const b = homeAbbr.replace(/[^a-z0-9]/gi, "").toLowerCase();
  if (a.length < 2 || b.length < 2) return false;
  return (
    compact.includes(`${a}vs${b}`) ||
    compact.includes(`${b}vs${a}`) ||
    compact.includes(`${a}at${b}`) ||
    compact.includes(`${b}at${a}`)
  );
}

export type GameVideoPhase = "preview" | "highlight";

export type WeekGameRef = {
  awayAbbr: string;
  homeAbbr: string;
  status: string;
  kickoff?: Date | string | null;
};

export function gameVideoPhase(
  game: Pick<WeekGameRef, "status" | "kickoff">,
  nowMs = Date.now()
): GameVideoPhase {
  const status = (game.status || "").toLowerCase();
  if (status === "final" || status === "live") return "highlight";
  if (game.kickoff != null) {
    const t = new Date(game.kickoff).getTime();
    if (Number.isFinite(t) && t <= nowMs) return "highlight";
  }
  return "preview";
}

const HIGHLIGHT_TITLE =
  /\b(highlights?|best plays?|condensed game|top plays?|every touchdown|recap)\b/i;
const PREVIEW_TITLE =
  /\b(preview|what to (know|watch)|matchup|keys to (the )?game|gameday preview)\b/i;

export function clipRole(title: string): "preview" | "highlight" | "other" {
  const highlight = HIGHLIGHT_TITLE.test(title);
  const preview = PREVIEW_TITLE.test(title);
  if (highlight && !preview) return "highlight";
  if (preview && !highlight) return "preview";
  if (highlight) return "highlight";
  return "other";
}

export function clipFitsGamePhase(
  title: string,
  phase: GameVideoPhase
): boolean {
  const role = clipRole(title);
  if (phase === "preview") return role !== "highlight";
  return role === "highlight";
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function tagText(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = xml.match(re);
  return m ? decodeXml(m[1].trim()) : null;
}

function attr(xml: string, name: string): string | null {
  const re = new RegExp(`${name}="([^"]+)"`);
  const m = xml.match(re);
  return m ? decodeXml(m[1]) : null;
}

/** Parse YouTube Atom RSS (`feeds/videos.xml`). No HTML scrape. */
export function parseYoutubeAtomFeed(xml: string): RawYoutubeHit[] {
  const out: RawYoutubeHit[] = [];
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  for (const entry of entries) {
    const videoId =
      tagText(entry, "yt:videoId") ||
      (tagText(entry, "id") || "").replace(/^yt:video:/, "") ||
      null;
    const title = tagText(entry, "title");
    if (!videoId || !title) continue;
    const link = attr(entry.match(/<link\b[^>]*>/i)?.[0] || "", "href") || "";
    const isShort = /\/shorts\//i.test(link);
    const thumb =
      attr(entry.match(/<media:thumbnail\b[^>]*>/i)?.[0] || "", "url") ||
      youtubeThumbUrl(videoId);
    out.push({
      videoId,
      title,
      channelName: tagText(entry, "name") || "YouTube",
      channelId: tagText(entry, "yt:channelId"),
      thumbnailUrl: thumb,
      publishedAt: tagText(entry, "published"),
      publishedLabel: null,
      durationSeconds: null,
      durationLabel: null,
      isShort,
    });
  }
  return out;
}

function innertubeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const o = node as Record<string, unknown>;
  if (typeof o.simpleText === "string") return o.simpleText;
  if (Array.isArray(o.runs)) {
    return o.runs
      .map((r) =>
        r && typeof r === "object" && "text" in r
          ? String((r as { text?: string }).text || "")
          : ""
      )
      .join("");
  }
  return "";
}

function browseIdFromRuns(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const runs = Array.isArray(o.runs) ? o.runs : [];
  for (const run of runs) {
    if (!run || typeof run !== "object") continue;
    const nav = (run as { navigationEndpoint?: { browseEndpoint?: { browseId?: string } } })
      .navigationEndpoint;
    const id = nav?.browseEndpoint?.browseId;
    if (id && id.startsWith("UC")) return id;
  }
  return null;
}

function walkInnertube(node: unknown, out: RawYoutubeHit[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const child of node) walkInnertube(child, out);
    return;
  }
  if (typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  const renderer = o.videoRenderer as Record<string, unknown> | undefined;
  if (renderer && typeof renderer.videoId === "string") {
    const videoId = renderer.videoId;
    const title = innertubeText(renderer.title);
    if (title) {
      const owner = (renderer.ownerText || renderer.longBylineText) as
        | unknown
        | undefined;
      const lengthLabel = innertubeText(renderer.lengthText);
      const durationSeconds = parseDurationLabel(lengthLabel);
      const thumbs = renderer.thumbnail as
        | { thumbnails?: Array<{ url?: string }> }
        | undefined;
      const thumbUrl =
        thumbs?.thumbnails?.[thumbs.thumbnails.length - 1]?.url ||
        youtubeThumbUrl(videoId);
      const badges = renderer.thumbnailOverlays;
      const badgeText = JSON.stringify(badges || "");
      const isShort =
        /shorts/i.test(badgeText) ||
        (durationSeconds != null && durationSeconds > 0 && durationSeconds < 60);
      out.push({
        videoId,
        title,
        channelName: innertubeText(owner) || "YouTube",
        channelId: browseIdFromRuns(owner),
        thumbnailUrl: thumbUrl,
        publishedAt: null,
        publishedLabel: innertubeText(renderer.publishedTimeText) || null,
        durationSeconds,
        durationLabel: lengthLabel || formatDurationLabel(durationSeconds),
        isShort,
      });
    }
  }
  for (const v of Object.values(o)) walkInnertube(v, out);
}

export function extractInnertubeVideos(payload: unknown): RawYoutubeHit[] {
  const out: RawYoutubeHit[] = [];
  walkInnertube(payload, out);
  const seen = new Set<string>();
  return out.filter((h) => {
    if (seen.has(h.videoId)) return false;
    seen.add(h.videoId);
    return true;
  });
}

export function clipFromHit(hit: RawYoutubeHit, bucket: VideoBucket): VideoClip {
  return {
    id: hit.videoId,
    title: hit.title,
    channel: hit.channelName || channelLabel(hit.channelId),
    channelId: hit.channelId,
    thumbnailUrl: hit.thumbnailUrl || youtubeThumbUrl(hit.videoId),
    publishedAt: hit.publishedAt,
    durationSeconds: hit.durationSeconds,
    durationLabel: hit.durationLabel || formatDurationLabel(hit.durationSeconds),
    bucket,
    watchUrl: youtubeWatchUrl(hit.videoId),
    embedUrl: youtubeEmbedUrl(hit.videoId),
    embeddable: clipAllowsWebsiteEmbed(hit),
  };
}

export function withEmbeddableFlag(
  clip: VideoClip,
  embeddable: boolean
): VideoClip {
  return { ...clip, embeddable };
}

export function scoreWeeklyHit(hit: RawYoutubeHit, week: number): number {
  let n = channelRank(hit.channelId);
  const t = hit.title;
  if (titleHasWeek(t, week)) n += 18;
  if (THIS_SEASON.test(t)) n += 12;
  if (/\bpreview\b/i.test(t)) n += 16;
  if (/\bhighlights?\b/i.test(t)) n += 14;
  if (/\brecap\b/i.test(t)) n += 10;
  if (/\bgame highlights\b/i.test(t)) n += 8;
  if (hit.durationSeconds != null && hit.durationSeconds >= 5 * 60) n += 4;
  return n;
}

export function scoreGameHit(hit: RawYoutubeHit, week: number): number {
  let n = channelRank(hit.channelId);
  const t = hit.title;
  if (/\bgame highlights\b/i.test(t)) n += 24;
  if (/\bhighlights?\b/i.test(t)) n += 12;
  if (titleHasWeek(t, week)) n += 16;
  if (THIS_SEASON.test(t)) n += 14;
  const dur = hit.durationSeconds;
  if (dur != null && dur >= 4 * 60 && dur <= 22 * 60) n += 10;
  return n;
}

export function scoreGamePreviewHit(hit: RawYoutubeHit, week: number): number {
  let n = channelRank(hit.channelId);
  const t = hit.title;
  if (/\bpreview\b/i.test(t)) n += 22;
  if (/\bmonday night|mnf\b/i.test(t)) n += 10;
  if (/\bwhat to (know|watch)|matchup|keys to\b/i.test(t)) n += 8;
  if (titleHasWeek(t, week)) n += 16;
  if (THIS_SEASON.test(t)) n += 14;
  const dur = hit.durationSeconds;
  if (dur != null && dur >= 4 * 60 && dur <= 30 * 60) n += 6;
  return n;
}

function usableHit(
  hit: RawYoutubeHit,
  extraTeams: string[] = []
): VideoBucket | null {
  if (!hit.videoId || !hit.title) return null;
  if (hit.isShort) return null;
  if (!clipIsThisNflSeason(hit)) return null;
  if (!isAllowlistedChannel(hit.channelId, extraTeams)) return null;
  if (/\b(madden|simulation|sim\b|full game replay|live stream)\b/i.test(hit.title)) {
    return null;
  }
  if (/\bpreseason\b/i.test(hit.title)) return null;
  if (/\bcollege football\b/i.test(hit.title)) return null;
  if (/\blive:|\blive\s+(recap|postgame|stream)|🔴/i.test(hit.title)) return null;
  return resolveBucket(hit);
}

export function groupWeeklyVideos(
  hits: RawYoutubeHit[],
  week: number,
  games: WeekGameRef[] = [],
  perBucket = 3,
  nowMs = Date.now()
): VideoGroups {
  const groups: VideoGroups = { short: [], medium: [], long: [] };
  const extraTeams = games.flatMap((g) => [g.awayAbbr, g.homeAbbr]);
  const anyPreview = games.some((g) => gameVideoPhase(g, nowMs) === "preview");
  const anyHighlight = games.some((g) => gameVideoPhase(g, nowMs) === "highlight");
  const ranked = hits
    .map((hit) => {
      const bucket = usableHit(hit, extraTeams);
      if (!bucket) return null;
      if (!weeklyHitFitsWeek(hit, week, games, anyPreview, anyHighlight, nowMs)) {
        return null;
      }
      return { hit, bucket, score: scoreWeeklyHit(hit, week) };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  for (const row of ranked) {
    if (seen.has(row.hit.videoId)) continue;
    if (groups[row.bucket].length >= perBucket) continue;
    seen.add(row.hit.videoId);
    groups[row.bucket].push(clipFromHit(row.hit, row.bucket));
  }
  return groups;
}

function weeklyHitFitsWeek(
  hit: RawYoutubeHit,
  week: number,
  games: WeekGameRef[],
  anyPreview: boolean,
  anyHighlight: boolean,
  nowMs: number
): boolean {
  if (!games.length) {
    return titleHasWeek(hit.title, week);
  }
  const matched = games.filter((g) =>
    titleMatchesGame(hit.title, g.awayAbbr, g.homeAbbr)
  );
  if (matched.length) {
    return matched.some((g) =>
      clipFitsGamePhase(hit.title, gameVideoPhase(g, nowMs))
    );
  }
  if (!titleHasWeek(hit.title, week)) return false;
  const role = clipRole(hit.title);
  if (role === "preview") return anyPreview;
  if (role === "highlight") return anyHighlight;
  return anyPreview || anyHighlight;
}

export function pickGameHighlights(
  hits: RawYoutubeHit[],
  opts: {
    week: number;
    awayAbbr: string;
    homeAbbr: string;
    limit?: number;
    phase?: GameVideoPhase;
  }
): VideoClip[] {
  const extra = [opts.awayAbbr, opts.homeAbbr];
  const phase: GameVideoPhase = opts.phase ?? "highlight";
  const ranked = hits
    .map((hit) => {
      const bucket = usableHit(hit, extra);
      if (!bucket) return null;
      if (!titleMatchesGame(hit.title, opts.awayAbbr, opts.homeAbbr)) return null;
      if (!clipFitsGamePhase(hit.title, phase)) return null;
      const score =
        phase === "preview"
          ? scoreGamePreviewHit(hit, opts.week)
          : scoreGameHit(hit, opts.week);
      return { hit, bucket, score };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const out: VideoClip[] = [];
  const limit = opts.limit ?? 4;
  for (const row of ranked) {
    if (seen.has(row.hit.videoId)) continue;
    seen.add(row.hit.videoId);
    out.push(clipFromHit(row.hit, row.bucket));
    if (out.length >= limit) break;
  }
  return out;
}

export function flattenGroups(groups: VideoGroups): VideoClip[] {
  return [...groups.short, ...groups.medium, ...groups.long];
}

export function groupsAreEmpty(groups: VideoGroups): boolean {
  return (
    groups.short.length === 0 &&
    groups.medium.length === 0 &&
    groups.long.length === 0
  );
}
