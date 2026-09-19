/**
 * Add to Home Screen nudge decisions (no browser).
 *
 *   npx tsx scripts/verify-pwa-install.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import {
  a2hsVariant,
  isAndroid,
  isInAppBrowser,
  isIOS,
  isMobile,
} from "../src/components/features/a2hs/env";
import {
  A2HS_SNOOZE_MS,
  shouldShowA2hs,
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
assert.equal(isInAppBrowser("Mozilla/5.0 WhatsApp/2.0"), true);
assert.equal(isInAppBrowser("Mozilla/5.0 Line/13.0"), true);
assert.equal(a2hsVariant(iphone), "ios");
assert.equal(a2hsVariant(android), "android");
assert.equal(a2hsVariant(fbIos), "inapp");
assert.equal(a2hsVariant(chromeIos), "inapp");

const ask = { mobile: true, standalone: false, status: "pending" as const };
assert.equal(shouldShowA2hs(ask), true, "iPhone Safari pending → show");
assert.equal(
  shouldShowA2hs({ ...ask, standalone: true }),
  false,
  "Home Screen icon → never show"
);
assert.equal(
  shouldShowA2hs({ ...ask, mobile: false }),
  false,
  "desktop → never show"
);
assert.equal(shouldShowA2hs({ ...ask, status: "optout" }), false, "opt-out persists");
assert.equal(
  shouldShowA2hs({ ...ask, status: "installed" }),
  false,
  "I added it / standalone → installed"
);
assert.equal(
  shouldShowA2hs({
    ...ask,
    status: "snoozed",
    snoozeUntil: Date.now() + A2HS_SNOOZE_MS,
  }),
  false,
  "Later hides for 3 days"
);
assert.equal(
  shouldShowA2hs({ ...ask, status: "snoozed", snoozeUntil: Date.now() - 1 }),
  true,
  "expired snooze → show again"
);

const manifest = readFileSync("public/manifest.webmanifest", "utf8");
assert.match(manifest, /"name": "NFL Pool"/);
assert.match(manifest, /"short_name": "NFL Pool"/);

const copy = readFileSync("src/components/features/a2hs/A2hsCopy.tsx", "utf8");
const ios = readFileSync("src/components/features/a2hs/A2hsIosHint.tsx", "utf8");
assert.match(copy, /Add NFL Pool to your Home Screen/);
assert.match(copy, /Install/);
assert.match(copy, /Open this link in/);
assert.match(copy, /Safari/);
assert.doesNotMatch(ios, /Share button/);
assert.match(ios, /bottom of Safari/);
assert.match(ios, /Add to Home Screen/);
assert.match(ios, /size=\{56\}/);

const apple = readFileSync("src/app/layout.tsx", "utf8");
assert.match(apple, /title: "NFL Pool"/);

console.log("verify-pwa-install OK");
