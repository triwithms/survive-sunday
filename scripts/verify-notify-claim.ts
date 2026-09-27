/**
 * Duplicate notices are "already sent" and do not throw or send again.
 * Background score/grade work must not be awaited on a player page.
 *
 *   npx tsx scripts/verify-notify-claim.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { claimedFreshRow, isUniqueConflict } from "../src/lib/unique-conflict";

assert.equal(isUniqueConflict({ code: "P2002" }), true);
assert.equal(
  isUniqueConflict(
    new Error(
      "Unique constraint failed on the fields: (`userId`,`type`,`dedupeKey`)"
    )
  ),
  true
);
assert.equal(isUniqueConflict(new Error("connection timeout")), false);
assert.equal(claimedFreshRow(1), true);
assert.equal(claimedFreshRow(0), false);
console.log("PASS  unique conflict is already-sent, not a new send");

const claim = readFileSync("src/lib/notify-log.ts", "utf8");
assert.match(claim, /createMany\(/);
assert.match(claim, /skipDuplicates:\s*true/);
assert.doesNotMatch(claim, /notificationSend\.create\(/);
assert.match(claim, /isUniqueConflict\(error\)\) return false/);
const dispatch = readFileSync("src/lib/notify-dispatch.ts", "utf8");
const claimedAt = dispatch.indexOf("if (!claimed) continue");
const sendAt = dispatch.indexOf("sendPlanned(");
assert.ok(claimedAt >= 0 && sendAt > claimedAt, "send only after a fresh claim");
console.log("PASS  claim does not throw and does not double-send");

const providers = readFileSync("src/components/Providers.tsx", "utf8");
assert.match(providers, /refetchInterval=\{0\}/);
assert.match(providers, /refetchOnWindowFocus=\{false\}/);
assert.doesNotMatch(providers, /refetchInterval=\{[1-9]/);
console.log("PASS  session poll stays off");

const pages = [
  "src/components/features/home/load-home.ts",
  "src/components/features/pick/load-pick.ts",
  "src/components/features/scores/load-scores.ts",
  "src/components/features/schedule/load-schedule.ts",
  "src/components/features/board/load-board.ts",
  "src/components/features/league/load-league.ts",
];
for (const file of pages) {
  const text = readFileSync(file, "utf8");
  assert.doesNotMatch(text, /await syncWeekScoresFromEspn|await ensureWeekLockedEffects/);
}
const refresh = readFileSync("src/lib/week-espn-refresh.ts", "utf8");
const locks = readFileSync("src/lib/week-lock-effects.ts", "utf8");
const session = readFileSync("src/lib/session.ts", "utf8");
const standings = readFileSync("src/lib/espn-standings.ts", "utf8");
for (const text of [refresh, locks, session, standings]) {
  assert.match(text, /deferAfter\(/);
}
assert.match(refresh, /catch \(error\)/);
console.log("PASS  page paint does not wait on score sync or grading");

const grading = readFileSync("src/lib/grading.ts", "utf8");
assert.match(grading, /skipDuplicates:\s*true/);
assert.match(grading, /result:\s*"pending"/);
assert.match(grading, /marked\.count === 0/);
const mirror = readFileSync("src/lib/pick-mirror-db.ts", "utf8");
assert.match(mirror, /skipDuplicates:\s*true/);
assert.match(mirror, /inserted\.count === 0\) return false/);
const roster = readFileSync("src/lib/live-roster.ts", "utf8");
assert.match(roster, /isUniqueConflict/);
assert.match(roster, /skipDuplicates:\s*true/);
console.log("PASS  other week-processing uniques do not throw");

const schema = readFileSync("prisma/schema.prisma", "utf8");
assert.match(schema, /model ServerError/);
assert.doesNotMatch(schema, /DROP TABLE/);
const ensure = readFileSync("src/lib/server-error-schema.ts", "utf8");
assert.match(ensure, /CREATE TABLE IF NOT EXISTS "ServerError"/);
assert.match(ensure, /ADD COLUMN IF NOT EXISTS/);
assert.doesNotMatch(ensure, /DROP /);
const boot = readFileSync("src/instrumentation.ts", "utf8");
assert.match(boot, /ensureServerErrorTable/);
assert.match(boot, /export async function onRequestError/);
const screen = readFileSync("src/components/features/admin/SystemScreen.tsx", "utf8");
assert.match(screen, /ServerErrorList/);
assert.match(screen, /WeekWrapPanel/);
console.log("PASS  server errors are stored for Admin → System");

console.log("verify-notify-claim OK");
