/** Official NFL “Every Touchdown of Week N” match. No network. */

export type TouchdownClip = {
  videoId: string;
  title: string;
  watchUrl: string;
  shortUrl: string;
  thumbUrl: string;
};

export function touchdownTitlePrefix(weekNumber: number): string {
  return `Every Touchdown of Week ${weekNumber}`;
}

/** Title starts with the week phrase. Week 1 does not match Week 10 or 11. */
export function titleStartsTouchdownWeek(
  title: string,
  weekNumber: number
): boolean {
  const trimmed = title.trim();
  const prefix = touchdownTitlePrefix(weekNumber);
  if (trimmed.length < prefix.length) return false;
  if (trimmed.slice(0, prefix.length).toLowerCase() !== prefix.toLowerCase()) {
    return false;
  }
  const rest = trimmed.slice(prefix.length);
  return rest.length === 0 || !/^\d/.test(rest);
}

type SearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string } | undefined>;
  };
};

function thumbFrom(item: SearchItem, videoId: string): string {
  const thumbs = item.snippet?.thumbnails;
  return (
    thumbs?.high?.url ||
    thumbs?.medium?.url ||
    thumbs?.default?.url ||
    `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
  );
}

/** Newest title match from a YouTube search.list payload. */
export function pickTouchdownClip(
  payload: unknown,
  weekNumber: number
): TouchdownClip | null {
  const items = (payload as { items?: SearchItem[] } | null)?.items;
  if (!Array.isArray(items)) return null;
  const matches: Array<{ at: number; clip: TouchdownClip }> = [];
  for (const item of items) {
    const videoId = item?.id?.videoId?.trim() ?? "";
    const title = item?.snippet?.title?.trim() ?? "";
    if (!videoId || !titleStartsTouchdownWeek(title, weekNumber)) continue;
    const at = Date.parse(item.snippet?.publishedAt ?? "");
    matches.push({
      at: Number.isFinite(at) ? at : 0,
      clip: {
        videoId,
        title,
        watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        shortUrl: `https://youtu.be/${encodeURIComponent(videoId)}`,
        thumbUrl: thumbFrom(item, videoId),
      },
    });
  }
  matches.sort((a, b) => b.at - a.at);
  return matches[0]?.clip ?? null;
}

export const TOUCHDOWN_SMS_MAX = 480;

export function emailTextWithTouchdown(
  body: string,
  clip: TouchdownClip | null
): string {
  if (!clip) return body;
  return `${body}\n${clip.title}\n${clip.watchUrl}`;
}

export function smsWithTouchdown(
  body: string,
  clip: TouchdownClip | null
): string {
  if (!clip) return body;
  const next = `${body}\n${clip.shortUrl}`;
  return next.length <= TOUCHDOWN_SMS_MAX ? next : body;
}

export function touchdownEmailHtml(clip: TouchdownClip | null): string {
  if (!clip) return "";
  const alt = clip.title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  const href = clip.watchUrl.replace(/"/g, "&quot;");
  const src = clip.thumbUrl.replace(/"/g, "&quot;");
  return `<p style="margin:12px 0 8px;"><a href="${href}"><img src="${src}" alt="${alt}" width="320" style="max-width:100%;height:auto;border:0;" /></a></p><p style="margin:0 0 8px;"><a href="${href}">${alt}</a></p>`;
}
