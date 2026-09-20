/** Header Share: current page URL via Web Share, else copy. */

export const PAGE_SHARE_COPIED = "Link copied";
export const PAGE_SHARE_FAILED = "Couldn’t copy — try again";
export const PAGE_SHARE_TITLE = "Survive Sunday";

const HIDDEN = ["/admin", "/account", "/login", "/join"] as const;
const LABELS: [string, string][] = [
  ["/pick", "My pick"],
  ["/pool", "Selections"],
  ["/standings", "Leaderboard"],
  ["/scores", "Scores"],
  ["/schedule", "Schedule"],
  ["/nfl", "Standings"],
  ["/help", "Help"],
  ["/videos", "Videos"],
];

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] || "/";
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function shouldShowHeaderShare(pathname: string): boolean {
  const path = normalizePath(pathname);
  return !HIDDEN.some((p) => path === p || path.startsWith(`${p}/`));
}

export function pageShareTitle(pathname: string): string {
  const path = normalizePath(pathname);
  const team = path.match(/^\/team\/([a-z0-9]+)(?:\/(.*))?$/i);
  if (team) {
    const rest = (team[2] || "").replace(/-/g, " ");
    const label = rest ? `${team[1]!.toUpperCase()} ${rest}` : team[1]!.toUpperCase();
    return `${PAGE_SHARE_TITLE} — ${label}`;
  }
  const hit = LABELS.find(([p]) => path === p || path.startsWith(`${p}/`));
  return hit ? `${PAGE_SHARE_TITLE} — ${hit[1]}` : PAGE_SHARE_TITLE;
}

export function canUseWebShare(data: ShareData): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  try {
    return typeof navigator.canShare === "function" ? navigator.canShare(data) : true;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    if (typeof document === "undefined") return false;
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.cssText = "position:fixed;left:-9999px";
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(input);
    return ok;
  } catch {
    return false;
  }
}

export async function shareCurrentPage(input: {
  url: string;
  title: string;
}): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const data: ShareData = { title: input.title, text: input.title, url: input.url };
  if (canUseWebShare(data)) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return "cancelled";
    }
  }
  return (await copyText(input.url)) ? "copied" : "failed";
}
