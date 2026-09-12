const CACHE = "survive-sunday-shell-v2";
const SHELL = ["/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isAuthSensitive(url) {
  const p = url.pathname;
  return (
    p === "/" ||
    p.startsWith("/pool") ||
    p.startsWith("/pick") ||
    p.startsWith("/admin") ||
    p.startsWith("/scores") ||
    p.startsWith("/standings") ||
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

  // Never cache authenticated HTML / RSC / API — stale /pool or /pick
  // from Aurora was showing up after switching to Frost.
  const documentLike =
    request.mode === "navigate" ||
    request.destination === "document" ||
    request.headers.get("RSC") === "1" ||
    url.searchParams.has("_rsc") ||
    isAuthSensitive(url);

  if (documentLike) {
    event.respondWith(fetch(request));
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
