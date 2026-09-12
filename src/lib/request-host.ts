/** Host / redirect helpers so Auth.js follows the public Host (tunnel), not localhost. */

export function isLoopbackHost(host: string): boolean {
  const raw = host.toLowerCase().trim();
  const hostname = raw.startsWith("[")
    ? raw.slice(1, raw.indexOf("]"))
    : raw.split(":")[0];
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
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
    if (isLoopbackHost(parsed.host)) {
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

/** Point Location + callback-url cookie at the request Host when Auth.js used localhost. */
export function rewriteAuthResponse(req: Request, res: Response): Response {
  const origin = requestPublicOrigin(req);
  if (!origin) return res;

  const headers = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "location") {
      headers.append(key, rewriteUrlToOrigin(value, origin));
      return;
    }
    if (lower === "set-cookie") {
      headers.append(key, rewriteCallbackUrlCookie(value, origin));
      return;
    }
    headers.append(key, value);
  });

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
    const init: RequestInit & { duplex?: "half" } = {
      method: req.method,
      headers: req.headers,
      redirect: "manual",
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = req.body;
      init.duplex = "half";
    }
    return new Request(next, init);
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
