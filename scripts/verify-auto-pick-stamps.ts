/**
 * Ranked auto-pick 💩 stamps + official winner eligibility (no database).
 *
 *   npx tsx scripts/verify-auto-pick-stamps.ts
 */
import assert from "node:assert/strict";
import {
  formatAutoPickStamps,
  isOfficialWinnerEligible,
  shouldStampAutoPick,
} from "../src/lib/auto-pick-stamps";
import {
  MIRROR_PICK_SOURCE,
  RANKED_PICK_SOURCE,
} from "../src/lib/pick-mirror";
import { resolveSeasonWinners } from "../src/lib/tiebreak";

assert.equal(shouldStampAutoPick(RANKED_PICK_SOURCE), true);
assert.equal(shouldStampAutoPick(MIRROR_PICK_SOURCE), false, "historic copy-from never stamped");
assert.equal(shouldStampAutoPick("imported"), false);
assert.equal(shouldStampAutoPick("user"), false);
assert.equal(shouldStampAutoPick("missed"), false);

assert.equal(formatAutoPickStamps(0), "");
assert.equal(formatAutoPickStamps(1), "💩");
assert.equal(formatAutoPickStamps(3), "💩💩💩");
assert.equal(formatAutoPickStamps(5), "💩💩💩💩💩");
assert.equal(formatAutoPickStamps(6), "💩×6");
assert.equal(isOfficialWinnerEligible(0), true);
assert.equal(isOfficialWinnerEligible(undefined), true);
assert.equal(isOfficialWinnerEligible(1), false);

const clean = {
  nickname: "Gams",
  status: "undefeated",
  losses: 0,
  weeksSurvived: 4,
  autoPickStamps: 0,
};
const stampedBetter = {
  nickname: "Busy",
  status: "undefeated",
  losses: 0,
  weeksSurvived: 8,
  autoPickStamps: 1,
};
const stampedOnly = resolveSeasonWinners([stampedBetter]);
assert.equal(stampedOnly.sole, null);
assert.deepEqual(stampedOnly.shared, []);
assert.equal(stampedOnly.officialEligible.length, 0);

const mixed = resolveSeasonWinners([stampedBetter, clean]);
assert.equal(mixed.sole?.nickname, "Gams");
assert.equal(mixed.officialEligible.length, 1);

const twoClean = resolveSeasonWinners([
  clean,
  { ...clean, nickname: "JaJa", autoPickStamps: 0 },
]);
assert.equal(twoClean.sole, null);
assert.deepEqual(
  twoClean.shared.map((m) => m.nickname),
  ["Gams", "JaJa"]
);

console.log("verify-auto-pick-stamps OK");
