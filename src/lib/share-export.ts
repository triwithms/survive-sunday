/** Share / export options for Board and Scores (plain-English group texts). */

export type ShareSurface = "board" | "scores";

export type ShareOptionId =
  | "full"
  | "picks"
  | "still-in"
  | "undefeated"
  | "games"
  | "live"
  | "pages";

export type ShareOption = {
  id: ShareOptionId;
  title: string;
  detail: string;
  /** Full long picture is always offered — never drop this. */
  always: boolean;
};

export type ShareOptionContext = {
  surface: ShareSurface;
  /** Rows still in (undefeated or one loss). */
  stillInCount: number;
  undefeatedCount: number;
  eliminatedCount: number;
  gameCount: number;
  liveGameCount: number;
  pickRowCount: number;
  /** Content is taller than a comfortable single picture. */
  tooLong: boolean;
};

/** Quiet open: long-press the page title or triple-tap the week label. */
export const SHARE_OPEN_EVENT = "ss-share-open";
export const SHARE_LONG_PRESS_MS = 550;
export const SHARE_TRIPLE_TAP_MS = 500;

export function recordTapTimes(
  times: number[],
  now: number,
  windowMs = SHARE_TRIPLE_TAP_MS
): number[] {
  return [...times, now].filter((t) => now - t <= windowMs);
}

export function isTripleTap(times: number[]): boolean {
  return times.length >= 3;
}

/** Comfortable tall picture (CSS pixels) before we also offer split pages. */
export const COMFORTABLE_SHARE_HEIGHT = 2400;

/** iOS Safari canvas side limit — stay under this when stitching. */
export const MAX_CANVAS_SIDE = 4096;

/** Hosts we will proxy for the share picture (ESPN / wiki marks). */
export const SHARE_IMAGE_HOSTS = [
  "a.espncdn.com",
  "upload.wikimedia.org",
] as const;

export function shareImageHostAllowed(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return SHARE_IMAGE_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export function isShareUrlAllowed(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    return shareImageHostAllowed(url.hostname);
  } catch {
    return false;
  }
}

export function isComfortablyLong(heightPx: number): boolean {
  return heightPx > COMFORTABLE_SHARE_HEIGHT;
}

export function shareOptionsFor(ctx: ShareOptionContext): ShareOption[] {
  const options: ShareOption[] = [];

  if (ctx.surface === "board") {
    options.push({
      id: "full",
      title: "Full Board (long picture)",
      detail:
        "The whole Board, like a long screenshot — everyone, still in and out.",
      always: true,
    });
    options.push({
      id: "picks",
      title: "This week’s picks",
      detail: "Everyone’s pick for this week. Status chips stay on each row.",
      always: false,
    });
    if (ctx.stillInCount > 0) {
      options.push({
        id: "still-in",
        title: "Still in",
        detail: "Friends who are undefeated or have one loss.",
        always: false,
      });
    }
    if (ctx.undefeatedCount > 0) {
      options.push({
        id: "undefeated",
        title: "Undefeated only",
        detail: "Friends who have not lost yet.",
        always: false,
      });
    }
  } else {
    options.push({
      id: "full",
      title: "Full Scores (long picture)",
      detail: "Games and everyone’s picks, like a long screenshot.",
      always: true,
    });
    if (ctx.gameCount > 0) {
      options.push({
        id: "games",
        title: "Scores only",
        detail: "Just the games and scores — no pick list.",
        always: false,
      });
    }
    if (ctx.pickRowCount > 0) {
      options.push({
        id: "picks",
        title: "This week’s picks",
        detail: "Everyone’s pick for this week.",
        always: false,
      });
    }
    if (ctx.liveGameCount > 0) {
      options.push({
        id: "live",
        title: "Live games only",
        detail: "Just the games that are on right now.",
        always: false,
      });
    }
  }

  if (ctx.tooLong) {
    options.push({
      id: "pages",
      title: "A few shorter pictures",
      detail:
        "Splits a long page so it’s easier to send. The full long picture is still above.",
      always: false,
    });
  }

  return options;
}

export function slugWeekLabel(weekLabel: string): string {
  const slug = weekLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "week";
}

export function shareFilename(args: {
  surface: ShareSurface;
  weekLabel: string;
  option: ShareOptionId;
  page?: number;
  pages?: number;
}): string {
  const week = slugWeekLabel(args.weekLabel);
  const base = `survive-sunday-${args.surface}-${week}-${args.option}`;
  if (args.pages && args.pages > 1 && args.page) {
    return `${base}-${args.page}-of-${args.pages}.png`;
  }
  return `${base}.png`;
}

export function shareCaption(
  surface: ShareSurface,
  weekLabel: string,
  option: ShareOptionId
): string {
  const page =
    surface === "board" ? "Board" : option === "games" ? "Scores" : "Scores";
  if (option === "full") return `Survive Sunday · ${weekLabel} · ${page}`;
  if (option === "picks") return `Survive Sunday · ${weekLabel} · picks`;
  if (option === "still-in") return `Survive Sunday · ${weekLabel} · still in`;
  if (option === "undefeated")
    return `Survive Sunday · ${weekLabel} · undefeated`;
  if (option === "games") return `Survive Sunday · ${weekLabel} · scores`;
  if (option === "live") return `Survive Sunday · ${weekLabel} · live games`;
  return `Survive Sunday · ${weekLabel} · ${page}`;
}

/** Group chunk heights into pages that stay under maxHeight. */
export function splitHeightsIntoPages(
  heights: number[],
  maxHeight: number
): number[][] {
  const cap = Math.max(1, maxHeight);
  const pages: number[][] = [];
  let current: number[] = [];
  let used = 0;
  heights.forEach((h, index) => {
    const size = Math.max(0, h);
    if (current.length > 0 && used + size > cap) {
      pages.push(current);
      current = [index];
      used = size;
      return;
    }
    current.push(index);
    used += size;
  });
  if (current.length) pages.push(current);
  return pages;
}

export function alwaysIncludesFull(options: ShareOption[]): boolean {
  return options.some((o) => o.id === "full" && o.always);
}
