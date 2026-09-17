/**
 * Guards for pool mode helpers (no database).
 *
 *   npx tsx scripts/verify-pool-mode.ts
 */
import assert from "node:assert/strict";
import {
  isDemoEmail,
  isDemoMode,
  isLiveMode,
  isPendingPlaceholderEmail,
  normalizePoolMode,
  practiceEmailFromPlaceholder,
} from "../src/lib/pool-mode";

assert.equal(normalizePoolMode("live"), "live");
assert.equal(normalizePoolMode("demo"), "demo");
assert.equal(normalizePoolMode(undefined), "live");
assert.equal(normalizePoolMode("other"), "live");
assert.equal(isLiveMode("live"), true);
assert.equal(isDemoMode("live"), false);
assert.equal(isDemoMode("demo"), true);
assert.equal(isDemoEmail("gams@survivesunday.demo"), true);
assert.equal(isDemoEmail("Gams@SurviveSunday.DEMO"), true);
assert.equal(isDemoEmail("go-giants@pending.survivesunday.local"), true);
assert.equal(isDemoEmail("the-boss@pending.survivesunday.local"), true);
assert.equal(isDemoEmail("robert@example.com"), false);
assert.equal(isDemoEmail("robertgama@gmail.com"), false);
assert.equal(isDemoEmail(null), false);
assert.equal(isPendingPlaceholderEmail("go-giants@pending.survivesunday.local"), true);
assert.equal(isPendingPlaceholderEmail("gams@survivesunday.demo"), false);
assert.equal(isPendingPlaceholderEmail("robertgama@gmail.com"), false);
assert.equal(
  practiceEmailFromPlaceholder("go-giants@pending.survivesunday.local"),
  "go-giants@survivesunday.demo"
);
assert.equal(
  practiceEmailFromPlaceholder("The-Boss@Pending.SurviveSunday.LOCAL"),
  "the-boss@survivesunday.demo"
);
assert.equal(practiceEmailFromPlaceholder("robertgama@gmail.com"), null);

console.log("verify-pool-mode OK");
