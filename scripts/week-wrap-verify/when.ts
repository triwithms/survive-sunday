import assert from "node:assert/strict";
import {
  isEligibleNoonDayAfter,
  torontoDateKey,
} from "../../src/lib/week-wrap-when";
import { preferredWrapWeek, shouldAutoSend } from "../../src/lib/week-wrap-status";

const sundayKick = new Date("2026-09-14T00:00:00.000Z");
const sundayLate = new Date("2026-09-14T03:30:00.000Z");
const mondayBeforeNoon = new Date("2026-09-14T15:00:00.000Z");
const mondayNoon = new Date("2026-09-14T16:00:00.000Z");
const mondayNight = new Date("2026-09-15T00:15:00.000Z");
const mondayLate = new Date("2026-09-15T03:40:00.000Z");
const tuesdayBeforeNoon = new Date("2026-09-15T15:00:00.000Z");
const tuesdayNoon = new Date("2026-09-15T16:00:00.000Z");
const tuesdayNight = new Date("2026-09-16T00:15:00.000Z");
const wednesdayBeforeNoon = new Date("2026-09-16T15:00:00.000Z");
const wednesdayNoon = new Date("2026-09-16T16:00:00.000Z");

assert.equal(torontoDateKey(sundayKick), "2026-09-13");
assert.equal(torontoDateKey(mondayNoon), "2026-09-14");

const sundayFinal = [{ status: "final", kickoff: sundayKick }];
assert.equal(isEligibleNoonDayAfter(sundayFinal, sundayLate), false);
assert.equal(isEligibleNoonDayAfter(sundayFinal, mondayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(sundayFinal, mondayNoon), true);
assert.equal(isEligibleNoonDayAfter([], mondayNoon), false);
assert.equal(
  isEligibleNoonDayAfter(
    [
      { status: "final", kickoff: sundayKick },
      { status: "live", kickoff: mondayNight },
    ],
    tuesdayNoon
  ),
  false
);
assert.equal(isEligibleNoonDayAfter([{ status: "final", kickoff: null }], mondayNoon), false);

const mondayFinal = [{ status: "final", kickoff: mondayNight }];
assert.equal(isEligibleNoonDayAfter(mondayFinal, mondayLate), false);
assert.equal(isEligibleNoonDayAfter(mondayFinal, tuesdayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(mondayFinal, tuesdayNoon), true);

const tuesdayFinal = [{ status: "final", kickoff: tuesdayNight }];
assert.equal(isEligibleNoonDayAfter(tuesdayFinal, wednesdayBeforeNoon), false);
assert.equal(isEligibleNoonDayAfter(tuesdayFinal, wednesdayNoon), true);

const estFinal = [{ status: "final", kickoff: new Date("2027-01-05T01:00:00.000Z") }];
assert.equal(isEligibleNoonDayAfter(estFinal, new Date("2027-01-05T16:00:00.000Z")), false);
assert.equal(isEligibleNoonDayAfter(estFinal, new Date("2027-01-05T17:00:00.000Z")), true);
assert.equal(isEligibleNoonDayAfter(sundayFinal, new Date("2026-09-21T16:00:00.000Z")), false);

assert.equal(
  shouldAutoSend({ games: sundayFinal, now: mondayNoon, skippedWeeks: [3], weekNumber: 3 }),
  false
);
assert.equal(
  shouldAutoSend({ games: sundayFinal, now: mondayBeforeNoon, skippedWeeks: [], weekNumber: 3 }),
  false
);
assert.equal(
  shouldAutoSend({ games: sundayFinal, now: mondayNoon, skippedWeeks: [], weekNumber: 3 }),
  true
);
assert.equal(
  preferredWrapWeek(
    [
      { number: 4, eligible: false, allFinal: false },
      { number: 3, eligible: true, allFinal: true },
    ],
    1
  ),
  3
);
console.log("PASS  noon day-after eligibility");
