/**
 * Phone chrome: viewport BottomNav + read-only header Week N.
 *
 *   npx tsx scripts/verify-app-chrome.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function src(path: string) {
  return readFileSync(path, "utf8");
}

const layout = src("src/app/(app)/layout.tsx");
assert.match(layout, /<BottomNav/);
assert.match(layout, /h-dvh max-h-dvh/);
assert.match(layout, /overflow-y-auto overflow-x-hidden/);
assert.doesNotMatch(
  layout,
  /pb-24/,
  "in-flow tab bar must not use spacer padding"
);
assert.doesNotMatch(
  layout,
  /min-h-dvh/,
  "app shell must be viewport-locked (h-dvh), not min-h-dvh"
);

const nav = src("src/components/BottomNav.tsx");
assert.match(nav, /shrink-0/);
assert.doesNotMatch(
  nav,
  /fixed bottom-0/,
  "position:fixed tab bar is lost on iOS when any ancestor becomes a scrollport"
);
assert.match(nav, /z-40/);
assert.match(nav, /pb-\[env\(safe-area-inset-bottom\)\]/);
assert.match(nav, /bg-stadium-900\/95/);
assert.match(nav, /My pick/);
assert.match(nav, /Selections/);
assert.match(nav, /Leaderboard/);
assert.match(nav, /Scores/);
assert.match(nav, /Schedule/);
assert.match(nav, /Standings/);

const css = src("src/app/globals.css");
assert.doesNotMatch(
  css,
  /html\s*\{[^}]*overflow-x:\s*(hidden|clip)/,
  "html overflow-x hidden/clip breaks iOS bottom nav"
);
assert.doesNotMatch(
  css,
  /body\s*\{[^}]*overflow-x:\s*(hidden|clip)/,
  "body overflow-x hidden/clip breaks iOS bottom nav"
);

const help = src("src/app/help/page.tsx");
assert.match(help, /h-dvh max-h-dvh/);
assert.match(help, /<BottomNav/);

const header = src("src/components/AppHeader.tsx");
assert.match(header, /weekNumber=\{data\.currentWeek\}/);
assert.doesNotMatch(
  header,
  /HeaderWeekNav|pickActionWeek|ChevronLeft|<select|<button/,
  "header week is a read-only pool label"
);

const badge = src("src/components/HeaderWeekBadge.tsx");
assert.match(badge, /headerPoolWeekLabel/);
assert.match(badge, /role="status"/);
assert.doesNotMatch(badge, /chip-gold|<button|<select|href=/);
assert.doesNotMatch(badge, /W\{weekNumber\}/);

for (const file of [
  "src/components/BottomNav.tsx",
  "src/components/HeaderWeekBadge.tsx",
  "src/components/AppHeader.tsx",
  "src/app/(app)/layout.tsx",
]) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

console.log("verify-app-chrome OK");
