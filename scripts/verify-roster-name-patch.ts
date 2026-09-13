/**
 * Guards for production real-name matching (no database).
 *
 *   npx tsx scripts/verify-roster-name-patch.ts
 */
import assert from "node:assert/strict";
import {
  ROSTER_NAME_FIXES,
  normalizePersonName,
  shouldReplaceRealName,
} from "../src/lib/roster-name-patch";

const longSnapper = ROSTER_NAME_FIXES.find((f) => f.nickname === "Long Snapper");
const steve = ROSTER_NAME_FIXES.find((f) => f.nickname === "Steve");
const gdogss = ROSTER_NAME_FIXES.find((f) => f.nickname === "Gdogss");
assert.ok(longSnapper && steve && gdogss);

assert.equal(normalizePersonName("J S"), "j s");
assert.equal(normalizePersonName("J.S."), "js");
assert.equal(normalizePersonName(" John Stilo "), "john stilo");

assert.equal(shouldReplaceRealName("J S", longSnapper, false), true);
assert.equal(shouldReplaceRealName("js", longSnapper, false), true);
assert.equal(shouldReplaceRealName("John Stilo", longSnapper, false), false);
assert.equal(shouldReplaceRealName(null, longSnapper, false), true);
assert.equal(shouldReplaceRealName("Steve", steve, false), true);
assert.equal(shouldReplaceRealName("Steve Venerus", steve, false), false);
assert.equal(shouldReplaceRealName("Custom Name", steve, false), false);
assert.equal(shouldReplaceRealName("Custom Name", steve, true), true);
assert.equal(shouldReplaceRealName("Gdogss", gdogss, false), true);
assert.equal(shouldReplaceRealName("Tony Gyuro", gdogss, false), false);

console.log("verify-roster-name-patch OK");
