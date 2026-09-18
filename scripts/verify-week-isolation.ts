/**
 * Live-only isolation must not pin the pool to Week 1 (no database).
 *
 *   npx tsx scripts/verify-week-isolation.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DEMO_SANDBOX_WEEK,
  REAL_CURRENT_WEEK,
  effectiveCurrentWeek,
  isSandboxWeekHidden,
  weeksForParticipants,
} from "../src/lib/pool-mode";
import { liveIsolationPatch } from "../src/lib/week-isolation";
import { loadWeek2Normalized } from "../src/lib/ensure-week-slate";

assert.equal(REAL_CURRENT_WEEK, 1);
assert.equal(DEMO_SANDBOX_WEEK, 2);
assert.equal(effectiveCurrentWeek("live", 2), 2);
assert.equal(effectiveCurrentWeek("live", 1), 1);
assert.equal(effectiveCurrentWeek("demo", 3), 3);
assert.equal(effectiveCurrentWeek(undefined, 2), 2);
assert.equal(effectiveCurrentWeek("live", null), 1);
assert.equal(isSandboxWeekHidden("live", 2), false);

const liveOnWeek2 = liveIsolationPatch({ mode: "live", currentWeek: 2 });
assert.equal(liveOnWeek2.changed, false);
assert.equal(liveOnWeek2.currentWeek, 2);
assert.equal(liveOnWeek2.data, null);

const demoOnWeek2 = liveIsolationPatch({ mode: "demo", currentWeek: 2 });
assert.equal(demoOnWeek2.changed, true);
assert.equal(demoOnWeek2.currentWeek, 2);
assert.deepEqual(demoOnWeek2.data, { mode: "live" });

const isolationSrc = readFileSync("src/lib/week-isolation.ts", "utf8");
assert.doesNotMatch(
  isolationSrc,
  /currentWeek:\s*REAL_CURRENT_WEEK/,
  "live isolation must not snap currentWeek to Week 1"
);

const weeks = [{ number: 1 }, { number: 2 }, { number: 3 }];
assert.deepEqual(
  weeksForParticipants("live", weeks).map((w) => w.number),
  [1, 2, 3]
);

const week2 = loadWeek2Normalized();
assert.equal(week2.week, 2);
assert.equal(week2.games.length, 16, "official 2026 Week 2 has 16 games");
assert.ok(week2.lockAt, "Week 2 lock time required");
assert.ok(
  week2.games.some((g) => g.awayAbbr === "DET" && g.homeAbbr === "BUF"),
  "TNF DET @ BUF"
);
assert.ok(
  week2.games.some((g) => g.awayAbbr === "NYG" && g.homeAbbr === "LAR"),
  "MNF NYG @ LAR"
);
assert.ok(
  !week2.games.some((g) => g.awayAbbr === "DAL" && g.homeAbbr === "NYG"),
  "demo DAL @ NYG pairing must not be the live slate"
);

console.log("verify-week-isolation OK");
