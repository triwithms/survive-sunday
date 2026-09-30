/**
 * Multi-pool rules that must stay true without a database.
 *   npx tsx scripts/verify-multi-pool.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  pickActivePoolId,
  poolChoicesFromMemberships,
} from "../src/lib/active-pool";
import {
  parseMulliganChoice,
  parseNewPoolName,
} from "../src/lib/create-pool-input";
import { overlayGamesByNumber } from "../src/lib/slate-overlay";
import { personalInviteUrl } from "../src/lib/invite-link";

function assertActivePool() {
  const family = {
    poolId: "family",
    createdAt: "2026-09-01T00:00:00.000Z",
    pool: { name: "Friends" },
  };
  const other = {
    poolId: "other",
    createdAt: "2026-09-20T00:00:00.000Z",
    pool: { name: "Office" },
  };
  assert.equal(pickActivePoolId([family], null), "family");
  assert.equal(pickActivePoolId([family], "not-yours"), "family");
  assert.equal(pickActivePoolId([family, other], "other"), "other");
  assert.equal(pickActivePoolId([other, family], null), "family");
  assert.equal(pickActivePoolId([], "family"), null);
  const choices = poolChoicesFromMemberships([
    other,
    { ...family, createdAt: "2026-09-02T00:00:00.000Z" },
    family,
  ]);
  assert.deepEqual(
    choices.map((pool) => pool.id),
    ["family", "other"]
  );
  assert.equal(choices[0]?.name, "Friends");
}

function assertCreateInput() {
  assert.equal(parseNewPoolName("  Office   Pool "), "Office Pool");
  assert.equal(parseNewPoolName("A"), null);
  assert.equal(parseNewPoolName(12), null);
  assert.equal(parseMulliganChoice("classic"), null);
  assert.equal(parseMulliganChoice("none"), 1);
  assert.equal(parseMulliganChoice("week-5"), undefined);
}

function assertSlateOverlay() {
  const own = [{ number: 1, games: [{ id: "owned" }] }];
  const filled = overlayGamesByNumber(own, new Map([[1, [{ id: "shared" }]]]));
  assert.equal(filled[0]?.games[0]?.id, "owned");
  const empty = [{ number: 2, games: [] as { id: string }[] }];
  const shared = overlayGamesByNumber(
    empty,
    new Map([[2, [{ id: "shared" }]]])
  );
  assert.equal(shared[0]?.games[0]?.id, "shared");
  assert.equal(overlayGamesByNumber(empty, null)[0]?.games.length, 0);
}

function assertGameLookupsFollowSlate() {
  const slate = readFileSync("src/lib/slate-games.ts", "utf8");
  assert.match(slate, /export async function findPoolGame/);
  assert.match(slate, /slateSourcePoolId\(poolId\)/);
  for (const file of [
    "src/app/api/scores/detail/route.ts",
    "src/app/api/videos/game/route.ts",
    "src/lib/page-week.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /findPoolGame\(/, file);
    assert.doesNotMatch(source, /week\.poolId !== me\.poolId/, file);
  }
}

function assertJoinLink() {
  const url = personalInviteUrl(
    "https://survive-sunday.vercel.app",
    { membershipId: "mem-9", nickname: "Pat", poolId: "pool-b" },
    [{ nickname: "Pat" }]
  );
  assert.match(url, /pool=pool-b/);
  assert.match(url, /who=pat/);
  assert.doesNotMatch(url, /SUNDAY26/);
}

function assertMigrationIsAdditive() {
  const sql = readFileSync(
    "prisma/migrations/20260929150000_pool_slate_source/migration.sql",
    "utf8"
  );
  assert.match(sql, /slatePoolId/);
  assert.match(sql, /IF NOT EXISTS/);
  const statements = sql.replace(/--.*$/gm, "");
  assert.doesNotMatch(statements, /^\s*(UPDATE|DELETE|DROP|TRUNCATE)\b/im);
  const session = readFileSync("src/lib/session.ts", "utf8");
  assert.match(session, /pickActivePoolId/);
  assert.match(session, /activeMemberships/);
  assert.match(session, /inviteCode === INVITE_CODE/);
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /slatePoolId/);
  const claim = readFileSync("src/lib/claim-seat-db.ts", "utf8");
  assert.match(claim, /seat\.poolId/);
}

assertActivePool();
assertCreateInput();
assertSlateOverlay();
assertGameLookupsFollowSlate();
assertJoinLink();
assertMigrationIsAdditive();
console.log("verify-multi-pool OK");
