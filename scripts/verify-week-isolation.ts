/**
 * Guards for Real=Week 1 / Demo=Week 2 helpers (no database).
 *
 *   npx tsx scripts/verify-week-isolation.ts
 */
import assert from "node:assert/strict";
import {
  DEMO_SANDBOX_WEEK,
  REAL_CURRENT_WEEK,
  effectiveCurrentWeek,
  isSandboxWeekHidden,
  weeksForParticipants,
} from "../src/lib/pool-mode";

assert.equal(REAL_CURRENT_WEEK, 1);
assert.equal(DEMO_SANDBOX_WEEK, 2);
assert.equal(effectiveCurrentWeek("live", 2), 1);
assert.equal(effectiveCurrentWeek("live", 1), 1);
assert.equal(effectiveCurrentWeek("demo", 2), 2);
assert.equal(effectiveCurrentWeek("demo", 1), 1);
assert.equal(isSandboxWeekHidden("live", 2), true);
assert.equal(isSandboxWeekHidden("live", 1), false);
assert.equal(isSandboxWeekHidden("demo", 2), false);

const weeks = [{ number: 1 }, { number: 2 }, { number: 3 }];
assert.deepEqual(
  weeksForParticipants("live", weeks).map((w) => w.number),
  [1, 3]
);
assert.deepEqual(
  weeksForParticipants("demo", weeks).map((w) => w.number),
  [1, 2, 3]
);

console.log("verify-week-isolation OK");
