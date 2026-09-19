/**
 * Pick-save outcome + snappy-UI file budget (no database).
 *
 *   npx tsx scripts/verify-pick-save.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyPickSave, pickSavedMessage } from "../src/components/features/pick/pick-save";

assert.deepEqual(applyPickSave({ ok: true }, null, "KC"), { kind: "ok", changed: false });
assert.deepEqual(applyPickSave({ ok: true }, "BUF", "KC"), { kind: "ok", changed: true });
assert.equal(pickSavedMessage(false), "Locked in — heading to Selections…");
assert.equal(pickSavedMessage(true), "Pick updated — heading to Selections…");

const locked = applyPickSave({ ok: false, locked: true }, "BUF", "KC");
assert.equal(locked.kind, "locked");
assert.match(locked.kind === "locked" ? locked.message : "", /locked/i);

const lockedCopy = applyPickSave({ ok: false, error: "Week is locked" }, "BUF", "KC");
assert.equal(lockedCopy.kind, "locked");

const err = applyPickSave({ ok: false, error: "Already used" }, "BUF", "KC");
assert.deepEqual(err, { kind: "error", message: "Already used" });

const fallback = applyPickSave({ ok: false }, null, "KC");
assert.deepEqual(fallback, { kind: "error", message: "Could not save pick" });

const files = [
  "src/components/ui/Button.tsx",
  "src/components/PickClient.tsx",
  "src/components/BottomNav.tsx",
  "src/components/features/pick/use-pick-submit.ts",
  "src/components/features/pick/pick-save.ts",
  "src/components/features/pick/PickConfirmPanel.tsx",
  "src/components/features/pick/PickScreen.tsx",
  "src/components/features/pick/PickSideButton.tsx",
  "src/components/features/pick/PickCurrentCard.tsx",
  "src/components/features/pick/PickOutOverlay.tsx",
];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

const button = readFileSync("src/components/ui/Button.tsx", "utf8");
assert.match(button, /pending\?: boolean/);
assert.match(button, /active:scale-\[0\.97\]/);
assert.match(button, /disabled=\{blocked\}/);
assert.doesNotMatch(button, /disabled=\{pending/);

const hook = readFileSync("src/components/features/pick/use-pick-submit.ts", "utf8");
assert.match(hook, /opts\?\.disabled/);
assert.match(hook, /useOptimistic/);
assert.match(hook, /setOptimisticPick\(abbr\)/);
assert.match(hook, /setBusy\(true\)/);
assert.match(hook, /startTransition/);

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: { build: string } };
assert.equal(pkg.scripts.build, "next build");

console.log("verify-pick-save OK");
