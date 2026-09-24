/**
 * Last-good schedule + injury cache (slice 1). No ESPN / DB.
 *
 *   npx tsx scripts/verify-static-cache.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  isLastGoodFresh,
  lastGoodServePlan,
  rememberLastGood,
  scoreboardTtlMs,
} from "../src/lib/last-good-cache";
import { payloadHash } from "../src/lib/payload-hash";
import {
  parseEspnScoreboard,
  slateFingerprint,
  type EspnGameSnapshot,
} from "../src/lib/espn-scoreboard-parse";
import { injuryFingerprint } from "../src/lib/injury-hash";
import type { LiveInjury } from "../src/lib/injury-parse";
import {
  INJURY_TTL_MS,
  SCOREBOARD_LIVE_TTL_MS,
  SCOREBOARD_SLATE_TTL_MS,
  STANDINGS_TTL_MS,
  pageEspnRefreshShape,
} from "../src/lib/static-cache-ttl";

function lines(path: string): number {
  const text = readFileSync(path, "utf8");
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function snap(over: Partial<EspnGameSnapshot>): EspnGameSnapshot {
  return {
    eventId: "1", awayAbbr: "KC", homeAbbr: "PHI", status: "scheduled",
    scoreAway: null, scoreHome: null, clockLabel: "Sun 1:00 PM ET",
    situationLabel: null, timeoutsAway: null, timeoutsHome: null,
    detail: null, odds: null, kickoffIso: "2026-09-20T17:00:00Z", ...over,
  };
}

for (const f of [
  "src/lib/static-cache-ttl.ts", "src/lib/payload-hash.ts", "src/lib/last-good-cache.ts",
  "src/lib/espn-scoreboard-types.ts", "src/lib/espn-scoreboard-parse.ts", "src/lib/espn-scoreboard.ts",
  "src/lib/injury-hash.ts", "src/lib/injury-cache.ts", "src/lib/live-injuries.ts",
  "src/lib/week-espn-refresh.ts",
]) {
  assert.ok(lines(f) <= 100, `${f} is ${lines(f)} lines (max 100)`);
}

assert.equal(payloadHash({ b: 1, a: 2 }), payloadHash({ a: 2, b: 1 }));
const scheduled = [snap({})];
assert.equal(slateFingerprint(scheduled), slateFingerprint([snap({ status: "live", scoreAway: 7, clockLabel: "Q2" })]));
assert.notEqual(slateFingerprint(scheduled), slateFingerprint([snap({ kickoffIso: "2026-09-20T20:00:00Z" })]));
const parsed = parseEspnScoreboard({
  events: [{
    id: "9", date: "2026-09-20T17:00:00Z",
    competitions: [{
      competitors: [
        { homeAway: "away", team: { abbreviation: "KC" } },
        { homeAway: "home", team: { abbreviation: "PHI" } },
      ],
      status: { type: { state: "pre", shortDetail: "Sun 1:00 PM ET" } },
    }],
  }],
});
assert.equal(parsed[0]?.kickoffIso, "2026-09-20T17:00:00Z");
assert.equal(scoreboardTtlMs(true, SCOREBOARD_LIVE_TTL_MS, SCOREBOARD_SLATE_TTL_MS), SCOREBOARD_LIVE_TTL_MS);

const t0 = 1_000_000;
const good = rememberLastGood(null, { value: "v1", hash: "h1", failed: false }, t0);
assert.equal(lastGoodServePlan(good, t0 + 10, 1000, 45, 2000), "fresh");
assert.equal(lastGoodServePlan(good, t0 + 1500, 1000, 45, 2000), "swr");
assert.equal(isLastGoodFresh(good, t0 + 10, 1000), true);
assert.equal(rememberLastGood(good, { value: "v2", hash: "h1", failed: false }, t0 + 5).value, "v1");
assert.equal(rememberLastGood(good, { value: "v2", hash: "h2", failed: false }, t0 + 5).value, "v2");
assert.equal(rememberLastGood(good, { value: "x", hash: "x", failed: true }, t0 + 5).value, "v1");

const row = (player: string): LiveInjury => ({
  teamAbbr: "BUF", player, position: "WR", status: "Out", injury: "Ankle",
  updated: null, comment: null, playerUrl: null,
});
assert.equal(injuryFingerprint([row("A"), row("B")]), injuryFingerprint([row("B"), row("A")]));
assert.notEqual(injuryFingerprint([row("A")]), injuryFingerprint([row("C")]));
assert.equal(INJURY_TTL_MS, 24 * 60 * 60 * 1000);
assert.equal(STANDINGS_TTL_MS, 10 * 60 * 1000);
assert.deepEqual(pageEspnRefreshShape(false), { standings: false, grade: true });
assert.deepEqual(pageEspnRefreshShape(true), { standings: false, grade: false });
assert.match(readFileSync("docs/FILE-MAP.md", "utf8"), /static-cache-ttl/);
assert.match(readFileSync("docs/HANDOFF.md", "utf8"), /last-good \*\*6h\*\*/);

const refresh = readFileSync("src/lib/week-espn-refresh.ts", "utf8");
assert.match(refresh, /after\(/);
assert.match(refresh, /enqueueWeekWork/);
assert.match(refresh, /if \(isWeekScoreboardFresh\(week\.number\)\) return;/);
assert.doesNotMatch(refresh, /await syncWeekScoresFromEspn/);
assert.match(refresh, /pageEspnRefreshShape/);

for (const path of [
  "src/components/features/home/load-home.ts",
  "src/components/features/pick/load-pick.ts",
  "src/components/features/scores/load-scores.ts",
  "src/components/features/schedule/load-schedule.ts",
]) {
  const src = readFileSync(path, "utf8");
  assert.match(src, /syncWeekEspnForPage/, `${path} must use the deferred page refresh`);
  assert.doesNotMatch(src, /syncWeekScoresFromEspn/, `${path} must not use the heavy sync`);
}

assert.doesNotMatch(
  readFileSync("src/components/features/team/load-team.ts", "utf8"),
  /syncWeekEspn|syncWeekScoresFromEspn/,
  "team page must not sync ESPN"
);
const league = readFileSync("src/components/features/league/load-league.ts", "utf8");
assert.match(league, /scheduleTeamStandingsRefresh/);
assert.doesNotMatch(league, /await syncTeamStandingsFromEspn/);

const heavy = readFileSync("src/app/api/scores/sync/route.ts", "utf8");
assert.match(heavy, /syncWeekScoresFromEspn\(week\.id\)/);
assert.doesNotMatch(heavy, /standings:\s*false/);

const deferredLockEffects = readFileSync("src/lib/week-lock-effects.ts", "utf8");
assert.match(deferredLockEffects, /after\(run\)/);
assert.match(deferredLockEffects, /enqueueWeekWork/);
assert.match(deferredLockEffects, /await ensureWeekLockedEffects/);
for (const path of [
  "src/components/features/home/load-home.ts",
  "src/components/features/pick/load-pick.ts",
  "src/components/features/scores/load-scores.ts",
  "src/components/features/board/load-board.ts",
]) {
  const src = readFileSync(path, "utf8");
  assert.match(src, /deferWeekLockedEffects/);
  assert.doesNotMatch(src, /await ensureWeekLockedEffects/);
}

const session = readFileSync("src/lib/session.ts", "utf8");
assert.match(session, /cache\(async/);
assert.match(session, /after\(run\)/);
assert.doesNotMatch(session, /picks:\s*\{\s*include:\s*\{\s*game:/);
const pageWeeks = readFileSync("src/lib/page-week.ts", "utf8");
assert.match(pageWeeks, /_count:\s*\{\s*select:\s*\{\s*games:\s*true/);
assert.match(pageWeeks, /number:\s*\{\s*in:\s*\[currentWeek, currentWeek \+ 1\]/);

for (const file of [
  "01-login.png", "02-pool-home.png", "03-pick-this-weeks-games.png",
  "04-team-research.png", "05-team-news.png", "06-league-standings.png",
  "07-board-survival.png", "08-change-pick.png", "09-schedule.png",
]) {
  assert.equal(existsSync(`public/help-preview/${file}`), false);
}
console.log("verify-static-cache: ok");
