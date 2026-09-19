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
const helpPage = readFileSync("src/app/help/page.tsx", "utf8");
assert.match(helpPage, /HelpContent/);
assert.match(helpPage, /safe-area-inset-top/);
assert.match(helpPage, /calc\(2rem\+env\(safe-area-inset-top\)\)/);
assert.match(helpPage, /min-h-11/);
assert.doesNotMatch(
  helpPage,
  /Wave 1|Wave 2|Notification preferences|account\/notifications|SignOutButton|showDemoCopy/
);
const helpInstall = readFileSync(
  "src/components/features/help/HelpInstall.tsx",
  "utf8"
);
assert.match(helpInstall, /HelpInstallLink/);
assert.match(helpInstall, /A2hsIosHint/);
assert.match(helpInstall, /id="install-home-screen"/);
assert.match(helpInstall, /Yes/);
assert.match(helpInstall, /Not now/);
assert.doesNotMatch(helpInstall, /bottom of Safari/);
const helpAdmins = readFileSync(
  "src/components/features/help/HelpForAdmins.tsx",
  "utf8"
);
assert.match(helpAdmins, /Users · Pool · System/);
assert.match(helpAdmins, /Add user/);
assert.match(helpAdmins, /nickname, full name, email, or cell/);
assert.match(helpAdmins, /Save this person/);
assert.match(helpAdmins, /Coming soon/);
assert.match(helpAdmins, /must be unique/);
assert.doesNotMatch(helpAdmins, /Commissioner|Users → Edit|Comms|Pick backup/);
assert.doesNotMatch(
  readFileSync("src/app/(app)/account/notifications/page.tsx", "utf8") +
    readFileSync("src/app/(app)/account/mirror/page.tsx", "utf8"),
  /help#8-/
);
const helpContent = readFileSync("src/components/HelpContent.tsx", "utf8");
assert.match(helpContent, /["']use client["']/);
assert.match(helpContent, /Back to Help topics/);
assert.match(helpContent, /HelpTopicMenu/);
assert.doesNotMatch(
  helpContent,
  /<HelpInstall \/>|<HelpSignIn \/>|<HelpPick \/>/,
  "Help must not stack every topic on /help"
);
assert.match(helpContent, /Never stack/);
assert.doesNotMatch(
  helpContent,
  /hash === null \? null/,
  "/help must SSR the topic menu, not a blank wait"
);
const helpMenu = readFileSync(
  "src/components/features/help/HelpTopicMenu.tsx",
  "utf8"
);
assert.match(helpMenu, /HELP_TOPICS/);
assert.doesNotMatch(
  helpMenu,
  /topic\.Component|<HelpInstall|<HelpSignIn/,
  "The Help menu must be links only"
);
const helpTopics = readFileSync(
  "src/components/features/help/topics.ts",
  "utf8"
);
assert.match(helpTopics, /hash: "install"/);
assert.match(helpTopics, /install-home-screen/);
assert.match(helpTopics, /hash: "account"/);
const topicTitles = [
  "Install on Home Screen",
  "How to sign in",
  "Making / changing a pick",
  "The tabs (My pick · Selections · Leaderboard · Scores · Schedule · Standings)",
  "Rules",
  "Account / password reset",
  "For Administrators",
];
let lastTitle = -1;
for (const title of topicTitles) {
  const i = helpTopics.indexOf(`title: "${title}"`);
  assert.ok(i > lastTitle, `Help topic order: ${title}`);
  lastTitle = i;
}
const helpTabs = readFileSync(
  "src/components/features/help/HelpScreens.tsx",
  "utf8"
);
assert.match(helpTabs, /My pick/);
assert.match(helpTabs, /Selections/);
assert.match(helpTabs, /Leaderboard/);
assert.match(helpTabs, /still in, then out/);
assert.match(helpTabs, /No week chip/);
assert.match(helpTabs, /Week N/);
assert.doesNotMatch(helpTabs, /\bHome\b|\bBoard\b|\bLeague\b|Commissioner|W#/);
const helpFiles = [
  "src/components/HelpContent.tsx",
  ...readdirSync("src/components/features/help")
    .filter((name) => /\.(ts|tsx)$/.test(name))
    .map((name) => join("src/components/features/help", name)),
];
for (const path of helpFiles) {
  const text = readFileSync(path, "utf8");
  const n = text.split("\n").length;
  assert.ok(n <= 100, `${path} is ${n} lines`);
  assert.doesNotMatch(
    text,
    /Wave 1|Wave 2|showDemoCopy|§1[0-6]|Pick backup|pick backup/
  );
}
const copy = readFileSync("src/components/features/a2hs/A2hsCopy.tsx", "utf8");
const ios = readFileSync("src/components/features/a2hs/A2hsIosHint.tsx", "utf8");
assert.match(copy, /Install/);
assert.match(copy, /Open in Safari first/);
assert.doesNotMatch(ios, /Share button/);
assert.doesNotMatch(ios, /bottom of Safari/);
assert.match(ios, /…/);
assert.match(ios, /Scroll down/);
assert.match(ios, /Share/);
assert.match(ios, /Add to Home Screen/);
assert.match(ios, /Safari/);
assert.match(ios, /Edit Actions/);
assert.match(ios, /size=\{56\}/);
const helpAccount = readFileSync(
  "src/components/features/help/HelpAccount.tsx",
  "utf8"
);
assert.doesNotMatch(helpAccount, /A2hsIosHint|bottom of Safari/);
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
