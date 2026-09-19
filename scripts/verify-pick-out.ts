/**
 * My pick OUT overlay + server reject (no database).
 *
 *   npx tsx scripts/verify-pick-out.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pickOutCopy } from "../src/components/features/pick/pick-out-copy";

function src(path: string) {
  return readFileSync(path, "utf8");
}

const copy = pickOutCopy();
assert.equal(copy.heading, "YOU'RE OUT");
assert.match(copy.body, /can'?t pick a team or change a pick/i);
assert.match(copy.hint, /bar below/i);
assert.match(copy.hint, /Leaderboard/);
assert.doesNotMatch(copy.body, /\bcolor\b/i);
console.log("PASS  overlay copy (Canadian English)");

const overlay = src("src/components/features/pick/PickOutOverlay.tsx");
assert.match(overlay, /data-testid="pick-out-overlay"/);
assert.match(overlay, /role="alert"/);
assert.match(overlay, /min-h-\[calc\(100dvh-9rem\)\]/);
assert.match(overlay, /text-5xl/);
assert.match(overlay, /border-crimson-400/);
assert.doesNotMatch(overlay, /aria-modal/);
assert.doesNotMatch(overlay, /z-\[100\]|z-50|createPortal/);
console.log("PASS  overlay is near-full, not a modal over bottom nav");

const client = src("src/components/PickClient.tsx");
assert.match(client, /if \(eliminated\)/);
assert.match(client, /<PickOutOverlay/);
assert.match(client, /usePickSubmit\(weekNumber, currentPick, \{ disabled: eliminated \}\)/);
console.log("PASS  PickClient swaps to overlay when out");

const notices = src("src/components/features/pick/PickNotices.tsx");
assert.doesNotMatch(notices, /Eliminated this season/);
assert.doesNotMatch(notices, /eliminated &&/);
console.log("PASS  tiny eliminated chip is gone");

const submit = src("src/app/actions/submit-pick.ts");
assert.match(submit, /status === "eliminated"/);
assert.match(submit, /You're out — no picks/);
assert.match(submit, /status: 403/);
console.log("PASS  server refuses out-player submits");

const nav = src("src/components/BottomNav.tsx");
assert.match(nav, /z-40/);
assert.match(nav, /My pick/);
assert.match(nav, /Leaderboard/);

const layout = src("src/app/(app)/layout.tsx");
assert.match(layout, /<BottomNav/);
assert.match(layout, /{children}/);

const files = [
  "src/components/features/pick/PickOutOverlay.tsx",
  "src/components/features/pick/pick-out-copy.ts",
  "src/components/features/pick/PickScreen.tsx",
  "src/components/features/pick/PickNotices.tsx",
  "src/components/PickClient.tsx",
  "src/app/actions/submit-pick.ts",
  "src/components/features/pick/use-pick-submit.ts",
];
for (const file of files) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

console.log("verify-pick-out OK");
