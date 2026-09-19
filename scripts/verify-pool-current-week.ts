/**
 * Pool board week is derived from the slate when the stored row lags.
 * Header must not follow a player's next-pick / action week.
 *
 *   npx tsx scripts/verify-pool-current-week.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { derivePoolCurrentWeek, shouldAdvanceStoredWeek } from "../src/lib/pool-current-week";
import { headerPoolWeekLabel } from "../src/lib/header-week-selection";

const satWeek2 = new Date("2026-09-19T16:00:00.000Z");
const week1 = {
  number: 1,
  games: [
    { status: "final", kickoff: new Date("2026-09-11T00:20:00.000Z") },
    { status: "final", kickoff: new Date("2026-09-15T00:15:00.000Z") },
  ],
};
const week2Live = {
  number: 2,
  games: [
    { status: "final", kickoff: new Date("2026-09-18T00:15:00.000Z") },
    { status: "scheduled", kickoff: new Date("2026-09-20T17:00:00.000Z") },
  ],
};
const week3 = {
  number: 3,
  games: [{ status: "scheduled", kickoff: new Date("2026-09-25T00:15:00.000Z") }],
};

assert.equal(
  derivePoolCurrentWeek(1, [week1, week2Live, week3], satWeek2),
  2,
  "stored 1 + Week 1 final → Week 2"
);
assert.equal(
  derivePoolCurrentWeek(1, [
    {
      number: 1,
      games: [{ status: "scheduled", kickoff: new Date("2026-09-15T00:15:00.000Z") }],
    },
    week2Live,
    week3,
  ], satWeek2),
  2,
  "Week 2 already underway even if Week 1 status lagged"
);
assert.equal(
  derivePoolCurrentWeek(2, [week1, week2Live, week3], satWeek2),
  2,
  "TNF started must not jump the pool to Week 3"
);
assert.equal(
  derivePoolCurrentWeek(2, [
    week1,
    {
      number: 2,
      games: [
        { status: "final", kickoff: new Date("2026-09-18T00:15:00.000Z") },
        { status: "final", kickoff: new Date("2026-09-22T00:15:00.000Z") },
      ],
    },
    week3,
  ], new Date("2026-09-22T08:00:00.000Z")),
  3,
  "advance only after the current slate is complete"
);
assert.equal(derivePoolCurrentWeek(2, [], satWeek2), 2, "no slate → keep stored");
assert.equal(shouldAdvanceStoredWeek(1, 2), true);
assert.equal(shouldAdvanceStoredWeek(2, 2), false);
assert.equal(shouldAdvanceStoredWeek(2, 1), false, "never go backward");
assert.equal(headerPoolWeekLabel(derivePoolCurrentWeek(1, [week1, week2Live], satWeek2)), "Week 2");

function src(path: string) {
  return readFileSync(path, "utf8");
}
const header = src("src/app/(app)/load-app-header.ts");
assert.match(header, /resolvedPoolWeek/);
assert.match(header, /persistPoolWeekAdvance/);
assert.doesNotMatch(
  header,
  /currentWeek:\s*decision\.actionWeek|weekNumber=\{[^}]*pickActionWeek/,
  "header week is the pool week, not pickActionWeek"
);
assert.match(src("src/components/AppHeader.tsx"), /weekNumber=\{data\.currentWeek\}/);
assert.match(src("src/lib/page-week.ts"), /resolvedPoolWeek/);
assert.match(src("src/app/api/cron/ensure-week/route.ts"), /persistPoolWeekAdvance/);

console.log("verify-pool-current-week OK");
