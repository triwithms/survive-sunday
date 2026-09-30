/**
 * Short client cache of already-opened tabs, and the Sunday poll skip.
 * No database.
 *
 *   npx tsx scripts/verify-tab-cache.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scoreSyncShouldRefresh } from "../src/lib/live-refresh-gate";

function src(path: string) {
  return readFileSync(path, "utf8");
}

const nextConfig = src("next.config.ts");
const dynamic = nextConfig.match(/dynamic:\s*(\d+)/);
assert.ok(dynamic, "staleTimes.dynamic is set");
const dynamicSeconds = Number(dynamic?.[1]);
assert.ok(
  dynamicSeconds >= 30 && dynamicSeconds <= 60,
  `visited-tab cache is ${dynamicSeconds}s (want 30–60)`
);
assert.match(nextConfig, /static:\s*0/);
assert.match(nextConfig, /prefetch=\{false\}/);
assert.match(nextConfig, /router\.refresh\(\)/);
assert.match(nextConfig, /window\.location/);
assert.match(nextConfig, /private, no-store/);

const nav = src("src/components/BottomNav.tsx");
assert.match(nav, /prefetch=\{false\}/);
assert.doesNotMatch(nav, /prefetch=\{true\}/);
assert.match(nav, /useLinkStatus/);
assert.match(nav, /data-nav-pending/);

assert.equal(scoreSyncShouldRefresh(null), false);
assert.equal(scoreSyncShouldRefresh({ changed: false, updated: 0, mirrored: 0 }), false);
assert.equal(scoreSyncShouldRefresh({ changed: true, updated: 0 }), true);
assert.equal(scoreSyncShouldRefresh({ updated: 2 }), true);
assert.equal(scoreSyncShouldRefresh({ mirrored: 1 }), true);

const refresh = src("src/components/LiveScoresRefresh.tsx");
assert.match(refresh, /scoreSyncShouldRefresh/);
assert.match(refresh, /if \(scoreSyncShouldRefresh\(data\)\) router\.refresh\(\)/);

const route = src("src/app/api/scores/sync/route.ts");
assert.match(route, /grade:\s*false/);
assert.match(route, /standings:\s*false/);
assert.match(route, /changed/);
assert.match(route, /syncPoolWeekFromEspn\(/);

const live = src("src/lib/live-scores.ts");
assert.match(live, /justFinished/);
assert.match(live, /gradePoolsOnSlate/);
assert.match(live, /opts\.standings === false && justFinished === 0/);
assert.match(live, /gradePoolWeek\(viewerWeekId, target\.viewerPoolId\)/);

assert.match(src("src/lib/pick-submit.ts"), /evaluatePickChange/);
assert.match(src("src/components/features/pick/use-pick-submit.ts"), /router\.refresh\(\)/);

for (const file of [
  "src/components/features/admin/use-admin-post.ts",
  "src/components/features/admin/use-enter-pick.ts",
  "src/components/features/admin/ImportPicksForm.tsx",
  "src/components/features/admin/PoolRulesForm.tsx",
  "src/components/features/admin/TeamLogosCard.tsx",
  "src/components/features/admin/use-roster-edit.ts",
  "src/components/features/admin/use-reset-pool.ts",
  "src/components/features/admin/TransferCommissionerForm.tsx",
  "src/components/features/admin/use-admin-role.ts",
]) {
  assert.match(src(file), /router\.refresh\(\)/, `${file} clears visited tabs`);
}

assert.match(src("src/components/PoolSwitcher.tsx"), /window\.location\.assign/);
assert.match(src("src/components/RoleSwitcher.tsx"), /window\.location\.assign/);
assert.match(src("src/lib/client-auth.ts"), /window\.location\.assign/);
assert.match(src("src/lib/client-auth.ts"), /form\.submit\(\)/);

const handoff = src("docs/HANDOFF.md");
for (const note of [
  "Share week reads",
  "Team page paint-first",
  "Mirror and lock",
  "Admin in one request",
  "Store win margin",
]) {
  assert.match(handoff, new RegExp(note));
}

console.log("verify-tab-cache: ok");
