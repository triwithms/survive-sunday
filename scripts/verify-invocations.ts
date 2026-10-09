/**
 * Unknown URLs must not boot the dynamic app. That 404 was a Function
 * Invocation per probe (robots.txt, apple-touch-icon, scanners).
 *
 *   npx tsx scripts/verify-invocations.ts
 */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";
import {
  API_PREFIXES,
  PUBLIC_MISS_BODY,
  PUBLIC_MISS_HOME,
  PUBLIC_MISS_KICKER,
  PUBLIC_MISS_TITLE,
  isAppleTouchIconProbe,
  isAppRoute,
  publicMissHtml,
} from "../src/lib/public-miss";
import {
  SCORE_DETAIL_JSON_MAX_AGE_MS,
  VIDEO_JSON_MAX_AGE_MS,
  fetchJsonDeduped,
} from "../src/lib/client-get-json";

const kept = [
  "/",
  "/login",
  "/login/forgot",
  "/welcome",
  "/join",
  "/join/pool",
  "/help",
  "/help/silver-fox.png",
  "/signed-in",
  "/pick",
  "/pool",
  "/scores",
  "/standings",
  "/schedule",
  "/nfl",
  "/videos",
  "/team/buf",
  "/team/buf/player/josh-allen",
  "/account",
  "/account/notifications",
  "/admin",
  "/admin/users",
  "/examples/week1-picks-import.csv",
  "/icons/apple-touch-icon.png",
  "/helmets/kc.png",
  "/favicon.ico",
  "/robots.txt",
  "/sw.js",
  "/api/auth/session",
  "/api/cron/week-wrap",
  "/api/scores/sync",
  "/api/picks",
];

for (const path of kept) {
  assert.equal(isAppRoute(path), true, `${path} must still reach the app`);
}

const probes = [
  "/robots.txt.bak",
  "/wp-admin",
  "/wp-login.php",
  "/foo",
  "/.env",
  "/sitemap.xml",
  "/.well-known/appspecific/com.chrome.devtools.json",
  "/apple-touch-icon.png",
  "/apple-touch-icon-precomposed.png",
  "/apple-touch-icon-180x180.png",
  "/random.png",
  "/api/wp-json",
  "/api/.env",
  "/api",
];

for (const path of probes) {
  assert.equal(isAppRoute(path), false, `${path} must not boot the dynamic app`);
}

assert.equal(isAppleTouchIconProbe("/apple-touch-icon.png"), true);
assert.equal(isAppleTouchIconProbe("/apple-touch-icon-precomposed.png"), true);
assert.equal(isAppleTouchIconProbe("/apple-touch-icon-120x120.png"), true);
assert.equal(isAppleTouchIconProbe("/icons/apple-touch-icon.png"), false);
assert.equal(isAppleTouchIconProbe("/helmets/kc.png"), false);

const apiDirs = readdirSync("src/app/api", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const name of apiDirs) {
  assert.equal(isAppRoute(`/api/${name}`), true, `API /${name} dropped from the allowlist`);
  assert.equal(isAppRoute(`/api/${name}/child`), true, `API /${name} is not a prefix`);
}
for (const prefix of API_PREFIXES) {
  const name = prefix.slice("/api/".length);
  assert.ok(apiDirs.includes(name), `${prefix} is not a real API folder`);
}

const html = publicMissHtml();
for (const sentence of [PUBLIC_MISS_KICKER, PUBLIC_MISS_TITLE, PUBLIC_MISS_BODY, PUBLIC_MISS_HOME]) {
  assert.ok(html.includes(sentence), `static miss dropped copy: ${sentence}`);
}
const notFound = readFileSync("src/app/not-found.tsx", "utf8");
assert.match(notFound, /PUBLIC_MISS_BODY/);
assert.match(notFound, /PUBLIC_MISS_HOME/);

assert.equal(existsSync("public/robots.txt"), true);
const robots = readFileSync("public/robots.txt", "utf8");
assert.match(robots, /Disallow:\s*\//);
assert.equal(existsSync("public/icons/apple-touch-icon.png"), true);

const middlewareSrc = readFileSync("src/middleware.ts", "utf8");
assert.ok(
  middlewareSrc.indexOf("isAppleTouchIconProbe") < middlewareSrc.indexOf("publicMissHtml"),
  "apple-touch probes must rewrite before the static miss"
);
assert.match(middlewareSrc, /status:\s*404/);
assert.match(middlewareSrc, /helmets\//);
assert.match(middlewareSrc, /icons\//);
assert.match(middlewareSrc, /robots\.txt/);
assert.doesNotMatch(
  middlewareSrc,
  /png\|jpg\|jpeg/,
  "excluding every image skips this middleware and boots the dynamic 404"
);

const nextConfig = readFileSync("next.config.ts", "utf8");
assert.match(nextConfig, /\/robots\.txt/);
assert.match(nextConfig, /png\|jpg\|jpeg/);
assert.doesNotMatch(nextConfig, /source:\s*"\/:path\*"[\s\S]*Vary/);

const providers = readFileSync("src/components/Providers.tsx", "utf8");
assert.match(providers, /refetchInterval=\{0\}/);
assert.doesNotMatch(providers, /refetchInterval=\{[1-9]/);

assert.equal(SCORE_DETAIL_JSON_MAX_AGE_MS, 30_000);
assert.ok(VIDEO_JSON_MAX_AGE_MS >= 60_000);
for (const file of [
  "src/components/ScoreGameDetailSheet.tsx",
  "src/components/GameHighlights.tsx",
  "src/components/WeeklyVideosPanel.tsx",
]) {
  const src = readFileSync(file, "utf8");
  assert.match(src, /fetchJsonDeduped/, `${file} must share one GET`);
  assert.doesNotMatch(src, /cache:\s*"no-store"/, `${file} must not force a function on every open`);
}

const live = readFileSync("src/components/LiveScoresRefresh.tsx", "utf8");
assert.match(live, /visibilityState === "visible"/);
assert.match(live, /LIVE_SCORE_POLL_MS/);

async function assertMiddlewareSkipsTheApp() {
  const miss = middleware(new NextRequest("https://survive-sunday.vercel.app/wp-login.php"));
  assert.equal(miss.status, 404);
  assert.match(await miss.text(), /That route doesn't exist/);
  const icon = middleware(
    new NextRequest("https://survive-sunday.vercel.app/apple-touch-icon.png")
  );
  assert.match(
    icon.headers.get("x-middleware-rewrite") ?? "",
    /\/icons\/apple-touch-icon\.png$/
  );
  const cron = middleware(
    new NextRequest("https://survive-sunday.vercel.app/api/cron/week-wrap", {
      headers: { host: "survive-sunday.vercel.app" },
    })
  );
  assert.equal(cron.headers.get("x-middleware-next"), "1");
  assert.notEqual(cron.status, 404);
  const pick = middleware(
    new NextRequest("https://survive-sunday.vercel.app/pick", {
      headers: { host: "survive-sunday.vercel.app" },
    })
  );
  assert.equal(pick.headers.get("x-middleware-next"), "1");
  assert.equal(
    pick.headers.get("x-middleware-request-x-forwarded-host"),
    "survive-sunday.vercel.app"
  );
}

async function assertDedupedGets() {
  await assertMiddlewareSkipsTheApp();
  let calls = 0;
  const original = globalThis.fetch;
  const hadWindow = "window" in globalThis;
  (globalThis as { window?: unknown }).window = globalThis;
  try {
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(
        JSON.stringify({ ok: true, groups: { short: [], medium: [], long: [] } }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch;

    const url = `https://example.test/api/videos/week?week=1&t=${Date.now()}`;
    const [first, second] = await Promise.all([
      fetchJsonDeduped(url, { maxAgeMs: 60_000 }),
      fetchJsonDeduped(url, { maxAgeMs: 60_000 }),
    ]);
    assert.equal(calls, 1, "parallel GETs must share one request");
    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    await fetchJsonDeduped(url, { maxAgeMs: 60_000 });
    assert.equal(calls, 1, "a fresh body must be reused inside maxAgeMs");
    await fetchJsonDeduped(url, { maxAgeMs: 60_000, fresh: true });
    assert.equal(calls, 2, "Retry must be allowed to fetch again");

    calls = 0;
    const failUrl = `https://example.test/fail?t=${Date.now()}`;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("no", { status: 500 });
    }) as typeof fetch;
    await fetchJsonDeduped(failUrl, { maxAgeMs: 60_000 });
    await fetchJsonDeduped(failUrl, { maxAgeMs: 60_000 });
    assert.equal(calls, 2, "a failed GET must not stick in the cache");
  } finally {
    globalThis.fetch = original;
    if (!hadWindow) delete (globalThis as { window?: unknown }).window;
  }
}

void assertDedupedGets().then(() => {
  console.log("verify-invocations: ok");
});
