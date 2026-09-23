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
export function titleStartsTouchdownWeek(title: string, weekNumber: number): boolean {
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
export function pickTouchdownClip(payload: unknown, weekNumber: number): TouchdownClip | null {
  const items = (payload as { items?: SearchItem[] } | null)?.items;
  if (!Array.isArray(items)) return null;
  let best: { at: number; clip: TouchdownClip } | null = null;
  for (const item of items) {
    const videoId = item?.id?.videoId?.trim() ?? "";
    const title = item?.snippet?.title?.trim() ?? "";
    if (!videoId || !titleStartsTouchdownWeek(title, weekNumber)) continue;
    const at = Date.parse(item.snippet?.publishedAt ?? "");
    const stamp = Number.isFinite(at) ? at : 0;
    if (best && stamp <= best.at) continue;
    best = {
      at: stamp,
      clip: {
        videoId,
        title,
        watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        shortUrl: `https://youtu.be/${encodeURIComponent(videoId)}`,
        thumbUrl: thumbFrom(item, videoId),
      },
    };
  }
  return best?.clip ?? null;
}
