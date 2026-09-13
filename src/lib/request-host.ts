import { NextRequest } from "next/server";

/** Host / redirect helpers so Auth.js follows the public Host (tunnel), not localhost. */

export function hostnameOf(host: string): string {
  const raw = host.toLowerCase().trim();
  if (raw.startsWith("[")) {
    const end = raw.indexOf("]");
    return end >= 0 ? raw.slice(1, end) : raw;
  }
  return raw.split(":")[0];
}

export function isLoopbackHost(host: string): boolean {
  const hostname = hostnameOf(host);
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

/** IANA reserved example.* names and www. variants — common AUTH_URL placeholders. */
const PLACEHOLDER_AUTH_HOSTS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "example.edu",
]);

export function isPlaceholderAuthHost(host: string): boolean {
  const hostname = hostnameOf(host);
  const bare = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  return PLACEHOLDER_AUTH_HOSTS.has(bare);
}

/** Loopback, IANA example.* placeholders, or an unparseable AUTH_URL. */
export function isIgnoredAuthHost(host: string): boolean {
  return isLoopbackHost(host) || isPlaceholderAuthHost(host);
}

export function isIgnoredAuthUrl(raw: string): boolean {
  try {
    return isIgnoredAuthHost(new URL(raw).host);
  } catch {
    return true;
  }
}

/**
 * AUTH_URL / NEXTAUTH_URL pin Auth.js origin (reqWithEnvURL). Drop values
 * that cannot be a real public site so Host + AUTH_TRUST_HOST win.
 */
export function stripIgnoredAuthUrlEnv(
  env: Record<string, string | undefined> = process.env,
): void {
  for (const key of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const raw = env[key];
    if (!raw) continue;
    if (isIgnoredAuthUrl(raw)) delete env[key];
  }
}

/** Public origin from Host / x-forwarded-* when the request is not loopback. */
export function requestPublicOrigin(req?: Request | { headers: Headers }): string | null {
  if (!req) return null;
  const rawHost = (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    ""
  )
    .split(",")[0]
    .trim();
  if (!rawHost || isLoopbackHost(rawHost)) return null;

  const forwardedProto = (req.headers.get("x-forwarded-proto") ?? "")
    .split(",")[0]
    .trim();
  const cfVisitor = req.headers.get("cf-visitor") ?? "";
  const proto =
    forwardedProto ||
    (rawHost.endsWith("trycloudflare.com") || /"scheme"\s*:\s*"https"/i.test(cfVisitor)
      ? "https"
      : "https");
  return `${proto}://${rawHost}`;
}

export function rewriteUrlToOrigin(url: string, origin: string): string {
  if (!url) return url;
  if (url.startsWith("/")) return `${origin}${url}`;
  try {
    const parsed = new URL(url);
    if (isIgnoredAuthHost(parsed.host)) {
      return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return url;
  } catch {
    return url;
  }
}

function rewriteCallbackUrlCookie(cookie: string, origin: string): string {
  const eq = cookie.indexOf("=");
  if (eq < 0) return cookie;
  const name = cookie.slice(0, eq).trim();
  if (
    name !== "authjs.callback-url" &&
    name !== "__Secure-authjs.callback-url"
  ) {
    return cookie;
  }
  const rest = cookie.slice(eq + 1);
  const semi = rest.indexOf(";");
  const rawVal = semi >= 0 ? rest.slice(0, semi) : rest;
  const attrs = semi >= 0 ? rest.slice(semi) : "";
  let decoded = rawVal;
  try {
    decoded = decodeURIComponent(rawVal);
  } catch {
    /* keep */
  }
  const rewritten = rewriteUrlToOrigin(decoded, origin);
  if (rewritten === decoded) return cookie;
  return `${name}=${encodeURIComponent(rewritten)}${attrs}`;
}

/**
 * Point Location + callback-url cookie at the request Host when Auth.js used
 * localhost / example.com.
 *
 * Copy Set-Cookie via getSetCookie() — never Headers.get("set-cookie").
 * get() joins cookies with commas, and Expires already contains a comma
 * (`Expires=Sun, 13 Dec 2026 …`). Safari rejects that mangled header, so
 * the session never sticks and the user bounces back to /login.
 */
export function rewriteAuthResponse(req: Request, res: Response): Response {
  const origin = requestPublicOrigin(req);
  if (!origin) return res;

  const headers = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") {
      return;
    }
    if (lower === "location") {
      headers.append(key, rewriteUrlToOrigin(value, origin));
      return;
    }
    headers.append(key, value);
  });

  const setCookies =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    headers.append("set-cookie", rewriteCallbackUrlCookie(cookie, origin));
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

/**
 * Rebuild the request URL from the public Host so Auth.js baseUrl is not
 * https://localhost:3000 (next dev + x-forwarded-proto, missing/stale AUTH_URL).
 */
export function requestWithPublicOrigin(req: Request): Request {
  const origin = requestPublicOrigin(req);
  if (!origin) return req;
  try {
    const current = new URL(req.url);
    const next = new URL(`${current.pathname}${current.search}${current.hash}`, origin);
    if (next.origin === current.origin) return req;
    // NextRequest's init rejects RequestInit.signal: null. Build a narrow
    // init object so `next build` type-checks and Auth.js still gets nextUrl.
    const init = {
      method: req.method,
      headers: req.headers,
      ...(req.method !== "GET" && req.method !== "HEAD"
        ? { body: req.body, duplex: "half" as const }
        : {}),
    };
    return new NextRequest(next, init);
  } catch {
    return req;
  }
}

export function requestOrigin(req: Request): string {
  return requestPublicOrigin(req) ?? new URL(req.url).origin;
}

export function requestAbsolute(req: Request, path: string): string {
  const origin = requestOrigin(req);
  if (!path.startsWith("/")) return path;
  return `${origin}${path}`;
}
