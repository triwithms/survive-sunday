const CACHE = "survive-sunday-shell-v6";
/** Only these never-change shell assets — never Next chunks (stable names in next dev). */
const SHELL = ["/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => caches.open(CACHE).then((c) => c.addAll(SHELL)))
      .then(() => self.clients.claim())
  );
});

function shouldBypass(url, request) {
  const p = url.pathname;
  // Next bundler assets use stable paths in `next dev` (e.g. app/page.js).
  // Caching them causes hydration mismatches (server HTML vs stale chunk) —
  // the red Next "1 error" toast on first landing after a code change.
  if (p.startsWith("/_next/")) return true;

  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc")
  ) {
    return true;
  }

  return (
    p === "/" ||
    p.startsWith("/pool") ||
    p.startsWith("/pick") ||
    p.startsWith("/admin") ||
    p.startsWith("/scores") ||
    p.startsWith("/standings") ||
    p.startsWith("/nfl") ||
    p.startsWith("/schedule") ||
    p.startsWith("/team") ||
    p.startsWith("/signed-in") ||
    p.startsWith("/login") ||
    p.startsWith("/join") ||
    p.startsWith("/help") ||
    p.startsWith("/api/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Do not intercept auth HTML / RSC / API / Next bundles. Letting the browser
  // fetch avoids SW "Failed to fetch" blanks and stale-chunk hydration toasts.
  if (shouldBypass(url, request)) {
    return;
  }

  // Allowlist-only cache: shell icons/manifest. Never open-cache arbitrary GETs.
  if (!SHELL.includes(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return fetched.then((res) => res || cached);
    })
  );
});
