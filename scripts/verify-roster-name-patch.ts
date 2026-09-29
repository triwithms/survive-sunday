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
  type RosterNameFix,
} from "../src/lib/roster-name-patch";

assert.deepEqual(
  ROSTER_NAME_FIXES,
  [],
  "legal names stay in the database, not in the shipped fix list"
);

const longSnapper: RosterNameFix = {
  nickname: "Long Snapper",
  realName: "Jamie Cole",
  stale: ["J S", "JS", "J.S.", "J. S.", "Long Snapper"],
};
const steve: RosterNameFix = {
  nickname: "Steve",
  realName: "Taylor Nguyen",
  stale: ["Steve"],
};
const gdogss: RosterNameFix = {
  nickname: "Sample Seat",
  realName: "Avery Brooks",
  stale: ["Sample Seat"],
};

assert.equal(normalizePersonName("J S"), "j s");
assert.equal(normalizePersonName("J.S."), "js");
assert.equal(normalizePersonName(" Jamie Cole "), "jamie cole");

assert.equal(shouldReplaceRealName("J S", longSnapper, false), true);
assert.equal(shouldReplaceRealName("js", longSnapper, false), true);
assert.equal(shouldReplaceRealName("Jamie Cole", longSnapper, false), false);
assert.equal(shouldReplaceRealName(null, longSnapper, false), true);
assert.equal(shouldReplaceRealName("Steve", steve, false), true);
assert.equal(shouldReplaceRealName("Taylor Nguyen", steve, false), false);
assert.equal(shouldReplaceRealName("Custom Name", steve, false), false);
assert.equal(shouldReplaceRealName("Custom Name", steve, true), true);
assert.equal(shouldReplaceRealName("Sample Seat", gdogss, false), true);
assert.equal(shouldReplaceRealName("Avery Brooks", gdogss, false), false);

console.log("verify-roster-name-patch OK");
