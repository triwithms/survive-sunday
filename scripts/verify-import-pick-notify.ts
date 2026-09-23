/**
 * Admin import pickConfirmed: same skip rule as a self-submit. No database.
 *
 *   npx tsx scripts/verify-import-pick-notify.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { importPickConfirmedChange } from "../src/lib/import-pick-notify";

assert.deepEqual(
  importPickConfirmedChange(null, "SEA"),
  { changed: false },
  "first import is a save, like writeUserPick with no existing pick"
);
assert.deepEqual(importPickConfirmedChange(undefined, "SEA"), { changed: false });
assert.deepEqual(
  importPickConfirmedChange({ teamAbbr: "KC" }, "SEA"),
  { changed: true },
  "different team is a change"
);
assert.equal(
  importPickConfirmedChange({ teamAbbr: "SEA" }, "SEA"),
  null,
  "re-import of the same team does not notify"
);
assert.deepEqual(
  importPickConfirmedChange({ teamAbbr: "MISS" }, "SEA"),
  { changed: true },
  "replacing a missed placeholder is a team change"
);

const route = readFileSync("src/app/api/admin/import-picks/route.ts", "utf8");
const dryRun = route.indexOf("if (dryRun)");
const notify = route.indexOf("schedulePickConfirmed(");
assert.ok(dryRun !== -1 && notify > dryRun, "dryRun returns before any notify");
assert.equal(
  route.split("schedulePickConfirmed(").length - 1,
  1,
  "one notify call, on the successful write path"
);
assert.match(route, /importPickConfirmedChange\(existingPick, teamAbbr\)/);
assert.match(route, /if \(notice\) \{\s*schedulePickConfirmed\(/);
assert.doesNotMatch(route, /await schedulePickConfirmed/);

const skipped = route.slice(
  route.indexOf("skippedMembershipUpdate"),
  route.indexOf("const freedTeam")
);
assert.doesNotMatch(
  skipped,
  /schedulePickConfirmed/,
  "same-team graded re-import does not notify"
);

console.log("verify-import-pick-notify OK");
