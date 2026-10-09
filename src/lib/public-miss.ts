/**
 * Paths that may enter the Next.js server. Everything else is a static miss.
 * A public Hobby app was rendering each unknown URL as a dynamic function
 * (root layout session read + no-store), so scanners, robots.txt, and
 * automatic icon probes burned Function Invocations.
 */

export const PUBLIC_MISS_KICKER = "404";
export const PUBLIC_MISS_TITLE = "Page not found";
export const PUBLIC_MISS_BODY =
  "That route doesn't exist — or the pool moved the goalposts.";
export const PUBLIC_MISS_HOME = "Back to Survive Sunday";

const PAGE_PREFIXES = [
  "/login",
  "/welcome",
  "/join",
  "/help",
  "/signed-in",
  "/pick",
  "/pool",
  "/scores",
  "/standings",
  "/schedule",
  "/nfl",
  "/videos",
  "/team",
  "/account",
  "/admin",
  "/examples",
] as const;

/** Top-level folders under src/app/api. Unknown /api/* must not boot the app. */
export const API_PREFIXES = [
  "/api/account",
  "/api/admin",
  "/api/auth",
  "/api/client-error",
  "/api/cron",
  "/api/demo",
  "/api/join",
  "/api/login",
  "/api/logout",
  "/api/membership",
  "/api/password",
  "/api/picks",
  "/api/scores",
  "/api/share",
  "/api/user",
  "/api/videos",
] as const;

const STATIC_PREFIXES = ["/icons", "/helmets", "/_next"] as const;

const STATIC_FILES = new Set([
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
]);

/** iOS still requests these at the site root even when a link rel icon exists. */
const APPLE_TOUCH =
  /^\/apple-touch-icon(?:-precomposed|-\d+x\d+)?\.png$/i;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname || "/";
}

function under(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function isAppleTouchIconProbe(pathname: string): boolean {
  return APPLE_TOUCH.test(normalizePath(pathname));
}

/** True when the request should reach Next (a real page, API, or static file). */
export function isAppRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === "/") return true;
  if (STATIC_FILES.has(path)) return true;
  if (STATIC_PREFIXES.some((prefix) => under(path, prefix))) return true;
  if (PAGE_PREFIXES.some((prefix) => under(path, prefix))) return true;
  if (path === "/api" || path.startsWith("/api/")) {
    return API_PREFIXES.some((prefix) => under(path, prefix));
  }
  return false;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Same sentences as the in-app not-found page, without booting the server. */
export function publicMissHtml(): string {
  const kicker = escapeHtml(PUBLIC_MISS_KICKER);
  const title = escapeHtml(PUBLIC_MISS_TITLE);
  const body = escapeHtml(PUBLIC_MISS_BODY);
  const home = escapeHtml(PUBLIC_MISS_HOME);
  return `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${title}</title>
</head>
<body style="margin:0;min-height:100dvh;background:#0B0E12;color:#f2f4f7;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif">
<main style="max-width:560px;margin:0 auto;padding:4rem 1rem">
<p style="color:#9aa5b5;font-size:14px;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px">${kicker}</p>
<h1 style="font-size:30px;color:#e8c547;letter-spacing:.04em;margin:0 0 12px">${title}</h1>
<p style="color:#9aa5b5;margin:0 0 32px">${body}</p>
<a href="/" style="display:inline-flex;align-items:center;min-height:44px;background:#e8c547;color:#0B0E12;font-weight:600;border-radius:10px;padding:.625rem 1.25rem;text-decoration:none">${home}</a>
</main>
</body>
</html>`;
}
