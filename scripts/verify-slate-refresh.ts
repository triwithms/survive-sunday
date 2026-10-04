/**
 * One shared slate refresh across pools. Pools that borrow the slate must not
 * independently sync ESPN for games they do not own: every score sync is keyed
 * by the slate owner's Week, and one write serves every pool until the ESPN
 * scoreboard TTL runs out. No database.
 *
 *   npx tsx scripts/verify-slate-refresh.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  createSlateRefresher,
  ownSlateWeekId,
  slateRowsCurrent,
} from "../src/lib/slate-refresh-gate";
import { LIVE_SCORE_POLL_MS } from "../src/lib/live-refresh-gate";
import { STANDINGS_TTL_MS } from "../src/lib/static-cache-ttl";

function assertOwnership() {
  const family = { id: "fam-w3", poolId: "family", ownGameCount: 16, slatePoolId: null };
  assert.equal(ownSlateWeekId(family), "fam-w3", "single-pool / family owns its rows");
  assert.equal(
    ownSlateWeekId({ id: "office-w3", poolId: "office", ownGameCount: 0, slatePoolId: "family" }),
    null,
    "a borrower with no Game rows reads the owner's week"
  );
  assert.equal(
    ownSlateWeekId({ id: "legacy-w3", poolId: "legacy", ownGameCount: 16, slatePoolId: "family" }),
    "legacy-w3",
    "a pool that still has its own Game rows keeps syncing them"
  );
  assert.equal(
    ownSlateWeekId({ id: "self-w3", poolId: "self", ownGameCount: 0, slatePoolId: "self" }),
    "self-w3"
  );
}

function assertRowsCurrent() {
  assert.equal(slateRowsCurrent(undefined, 100), false, "never written");
  assert.equal(slateRowsCurrent(100, 100), true, "written from the fresh fetch");
  assert.equal(slateRowsCurrent(90, 100), false, "a newer fetch has not been written");
  assert.equal(slateRowsCurrent(100, null), false, "scoreboard TTL ran out");
}

/** Fake ESPN scoreboard cache with the same fresh/stale contract as espn-scoreboard.ts. */
function fakeScoreboard() {
  let now = 1_000;
  let fetchedAt: number | null = null;
  const ttl = 20_000;
  let espnCalls = 0;
  return {
    get espnCalls() { return espnCalls; },
    advance(ms: number) { now += ms; },
    freshFetchedAt: () => (fetchedAt !== null && now - fetchedAt < ttl ? fetchedAt : null),
    fetch() {
      if (fetchedAt === null || now - fetchedAt >= ttl) {
        espnCalls += 1;
        fetchedAt = now;
      }
      return fetchedAt;
    },
  };
}

async function assertBorrowersShareOneWrite() {
  const espn = fakeScoreboard();
  const refresher = createSlateRefresher(() => espn.freshFetchedAt());
  const writes: string[] = [];
  const write = (slateWeekId: string) => async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    writes.push(slateWeekId);
    return { scoreboardAt: espn.fetch() };
  };
  const key = (slateWeekId: string) => ({ slateWeekId, number: 3, year: 2026 });

  // Family (owner) plus two borrowing pools open Scores at once; all resolve to the owner's week.
  const viewers = ["family", "office", "cousins"];
  const results = await Promise.all(viewers.map(() => refresher.run(key("fam-w3"), write("fam-w3"))));
  assert.deepEqual(writes, ["fam-w3"], "concurrent pools share one slate write");
  assert.equal(espn.espnCalls, 1);
  assert.ok(results.every((r) => r !== null), "joiners get the shared result");

  espn.advance(5_000);
  for (let i = 0; i < viewers.length; i++) {
    assert.equal(await refresher.run(key("fam-w3"), write("fam-w3")), null);
  }
  const forced = await refresher.run(key("fam-w3"), write("fam-w3"), { force: true });
  assert.ok(forced, "Refresh can write even while the normal TTL still says current");
  assert.deepEqual(writes, ["fam-w3", "fam-w3"]);
  assert.equal(espn.espnCalls, 1, "a fresh scoreboard is not fetched twice");
  assert.equal(refresher.isSettled(key("fam-w3")), true);
  assert.equal(espn.espnCalls, 1);

  espn.advance(20_000);
  assert.equal(refresher.isSettled(key("fam-w3")), false, "TTL expiry reopens the gate");
  await Promise.all(viewers.map(() => refresher.run(key("fam-w3"), write("fam-w3"))));
  assert.deepEqual(writes, ["fam-w3", "fam-w3", "fam-w3"], "one write per scoreboard fetch");
  assert.equal(espn.espnCalls, 2);

  // A second pool that owns its own rows still gets them written, from the cached scoreboard.
  await refresher.run(key("test-w3"), write("test-w3"));
  assert.deepEqual(writes, ["fam-w3", "fam-w3", "fam-w3", "test-w3"]);
  assert.equal(espn.espnCalls, 2, "the second owner reads the cached scoreboard");

  const failing = createSlateRefresher(() => espn.freshFetchedAt());
  await assert.rejects(failing.run(key("fam-w3"), async () => { throw new Error("espn down"); }));
  assert.equal(failing.isSettled(key("fam-w3")), false, "a failed write is not marked current");
  assert.equal(await failing.run(key("fam-w3"), async () => ({ scoreboardAt: null })) !== null, true);
  assert.equal(failing.isSettled(key("fam-w3")), false, "an ESPN failure (null stamp) retries next time");
}

function srcFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map((file) => path.join(dir, file));
}

function assertSingleEntryPoint() {
  const files = srcFiles("src");
  const heavyCallers = files.filter((file) =>
    /syncWeekScoresFromEspn\(/.test(readFileSync(file, "utf8").replace(/function syncWeekScoresFromEspn\(/, ""))
  );
  assert.deepEqual(heavyCallers, ["src/lib/live-scores.ts"], "only live-scores writes a week's Game rows");

  const live = readFileSync("src/lib/live-scores.ts", "utf8");
  const calls = [...live.matchAll(/(?<!function )syncWeekScoresFromEspn\(([^,)]+)/g)].map((m) => m[1]);
  assert.deepEqual(calls, ["target.slateWeekId"], "the Game-row write is keyed by the slate owner's week");
  assert.match(live, /slateRefresher\.run\(target,/);
  assert.match(live, /target\.borrowed/);
  assert.match(live, /gradePoolWeek\(viewerWeekId, target\.viewerPoolId\)/, "borrowers grade only their own picks");

  for (const file of [
    "src/app/api/scores/sync/route.ts",
    "src/app/api/cron/ensure-week/route.ts",
    "src/lib/week-wrap-run.ts",
    "src/lib/week-wrap-send.ts",
    "src/lib/week-espn-refresh.ts",
  ]) {
    assert.match(readFileSync(file, "utf8"), /syncPoolWeekFromEspn\(/, `${file} must use the slate-keyed sync`);
  }

  const page = readFileSync("src/lib/week-espn-refresh.ts", "utf8");
  assert.match(page, /week\.games\[0\]\?\.weekId/, "page gate reads the overlaid owner weekId");
  assert.match(page, /deferAfter\(/, "paint-first: ESPN runs after the response");
  assert.doesNotMatch(page, /await syncPoolWeekFromEspn/);

  const scoreboardReaders = files.filter(
    (file) => file !== "src/lib/espn-scoreboard.ts" && /fetchEspnWeekScoreboard\(/.test(readFileSync(file, "utf8"))
  ).sort();
  assert.deepEqual(
    scoreboardReaders,
    ["src/lib/espn-game-detail.ts", "src/lib/live-scores.ts"],
    "no new ESPN scoreboard callers outside the shared path"
  );

  const standingsCallers = files.filter(
    (file) => file !== "src/lib/espn-standings.ts" && /syncTeamStandingsFromEspn\(/.test(readFileSync(file, "utf8"))
  );
  // Week wrap forces a pull so a sent email never shows stale W-L.
  assert.deepEqual(standingsCallers, ["src/lib/week-wrap-extras.ts"], "score syncs use the capped standings refresh");
  assert.match(live, /syncTeamStandingsIfStale\(\)/);

  assert.equal(LIVE_SCORE_POLL_MS, 10 * 60 * 1000, "browser live poll cap unchanged");
  assert.equal(STANDINGS_TTL_MS, 10 * 60 * 1000);

  const gate = readFileSync("src/lib/slate-refresh-gate.ts", "utf8");
  assert.doesNotMatch(gate, /prisma|server-only/, "gate stays pure");
  assert.doesNotMatch(readFileSync("prisma/schema.prisma", "utf8"), /scoresSyncedAt|slateLock/i, "no schema change");
}

async function main() {
  assertOwnership();
  assertRowsCurrent();
  await assertBorrowersShareOneWrite();
  assertSingleEntryPoint();
  console.log("verify-slate-refresh OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
