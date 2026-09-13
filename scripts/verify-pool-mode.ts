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
  normalizePoolMode,
} from "../src/lib/pool-mode";

assert.equal(normalizePoolMode("live"), "live");
assert.equal(normalizePoolMode("demo"), "demo");
assert.equal(normalizePoolMode(undefined), "demo");
assert.equal(normalizePoolMode("other"), "demo");
assert.equal(isLiveMode("live"), true);
assert.equal(isDemoMode("live"), false);
assert.equal(isDemoMode("demo"), true);
assert.equal(isDemoEmail("gams@survivesunday.demo"), true);
assert.equal(isDemoEmail("Gams@SurviveSunday.DEMO"), true);
assert.equal(isDemoEmail("robert@example.com"), false);
assert.equal(isDemoEmail(null), false);

console.log("verify-pool-mode OK");
