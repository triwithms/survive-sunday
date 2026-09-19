/**
 * Phone chrome: fixed BottomNav + read-only header Week N.
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
assert.match(layout, /pb-24/);
assert.doesNotMatch(
  layout,
  /min-h-dvh[^"]*overflow-x-hidden/,
  "app shell must not overflow-x-hidden (iOS contains position:fixed)"
);

const nav = src("src/components/BottomNav.tsx");
assert.match(nav, /fixed bottom-0 inset-x-0/);
assert.match(nav, /z-40/);
assert.match(nav, /pb-\[env\(safe-area-inset-bottom\)\]/);
assert.match(nav, /bg-stadium-900\/95/);

const css = src("src/app/globals.css");
assert.match(css, /overflow-x:\s*clip/);
assert.doesNotMatch(
  css,
  /html\s*\{[^}]*overflow-x:\s*hidden/,
  "html overflow-x:hidden breaks iOS fixed bottom nav"
);
assert.doesNotMatch(
  css,
  /body\s*\{[^}]*overflow-x:\s*hidden/,
  "body overflow-x:hidden breaks iOS fixed bottom nav"
);

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
