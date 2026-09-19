/**
 * Add to Home Screen nudge decisions (no browser).
 *
 *   npx tsx scripts/verify-pwa-install.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  a2hsVariant,
  isAndroid,
  isInAppBrowser,
  isIOS,
  isMobile,
} from "../src/components/features/a2hs/env";
import {
  reconcileA2hs,
  shouldShowA2hs,
  statusAfterLogin,
} from "../src/components/features/a2hs/state";

const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const android =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const desktop =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const fbIos =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/1.0]";
const instagram = "Mozilla/5.0 (iPhone) Instagram 300.0.0";
const chromeIos =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";

assert.equal(isMobile(iphone), true);
assert.equal(isIOS(iphone), true);
assert.equal(isAndroid(android), true);
assert.equal(isIOS(android), false);
assert.equal(isMobile(desktop), false);
assert.equal(isMobile("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 5), true);
assert.equal(isInAppBrowser(fbIos), true);
assert.equal(isInAppBrowser(instagram), true);
assert.equal(a2hsVariant(iphone), "ios");
assert.equal(a2hsVariant(android), "android");
assert.equal(a2hsVariant(fbIos), "inapp");
assert.equal(a2hsVariant(chromeIos), "inapp");

const ask = { mobile: true, standalone: false, status: "pending" as const };
assert.equal(shouldShowA2hs(ask), true, "login pending → show");
assert.equal(shouldShowA2hs({ ...ask, standalone: true }), false, "icon → hide");
assert.equal(shouldShowA2hs({ ...ask, mobile: false }), false, "desktop → hide");
assert.equal(shouldShowA2hs({ ...ask, status: "optout" }), false, "No → hide");
assert.equal(shouldShowA2hs({ ...ask, status: "not_now" }), false, "Not now → hide");
assert.equal(shouldShowA2hs({ ...ask, status: "installed" }), false, "installed");
assert.equal(reconcileA2hs({ status: "installed" }, false).status, "pending");
assert.equal(reconcileA2hs({ status: "optout" }, false).status, "optout");
assert.equal(reconcileA2hs({ status: "not_now" }, false).status, "not_now");
assert.equal(reconcileA2hs({ status: "pending" }, true).status, "installed");
assert.equal(statusAfterLogin({ status: "not_now" }).status, "pending");
assert.equal(statusAfterLogin({ status: "optout" }).status, "optout");
assert.equal(statusAfterLogin({ status: "pending" }).status, "pending");

const card = readFileSync("src/components/features/a2hs/A2hsCard.tsx", "utf8");
assert.match(card, /Do you want to add NFL Pool to your Home Screen\?/);
assert.match(card, />\s*Yes\s*</);
assert.match(card, />\s*No\s*</);
assert.match(card, />\s*Not now\s*</);
assert.doesNotMatch(card, /Later|I added it|Don.?t ask again/);
const help = readFileSync("src/app/help/page.tsx", "utf8");
assert.match(help, /HelpInstallLink/);
const copy = readFileSync("src/components/features/a2hs/A2hsCopy.tsx", "utf8");
const ios = readFileSync("src/components/features/a2hs/A2hsIosHint.tsx", "utf8");
assert.match(copy, /Install/);
assert.match(copy, /Open in Safari first/);
assert.doesNotMatch(ios, /Share button/);
assert.match(ios, /bottom of Safari/);
assert.match(ios, /size=\{56\}/);
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
assert.match(manifest, /"name": "NFL Pool"/);
assert.match(manifest, /"short_name": "NFL Pool"/);

for (const name of readdirSync("src/components/features/a2hs")) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  const path = join("src/components/features/a2hs", name);
  const n = readFileSync(path, "utf8").split("\n").length;
  assert.ok(n <= 101, `${path} is ${n} lines`);
}

console.log("verify-pwa-install OK");
