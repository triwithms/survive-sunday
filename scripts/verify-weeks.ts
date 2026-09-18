/**
 * Default week selection for Home / Pick / Scores / Schedule / Videos (no database).
 *
 *   npx tsx scripts/verify-weeks.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolvePlayerPickWeek } from "../src/lib/next-week-picks";
import {
  WEEK_NAV_PATHS,
  defaultWeekForPath,
  parseWeekParam,
  resolvePageWeekNumber,
  resolveSelectedWeekNumber,
  usesPlayerPickWeekDefault,
} from "../src/lib/weeks";

const weekNumbers = [1, 2, 3];
const sunday = new Date("2026-09-13T16:00:00.000Z");
const lacKickoff = new Date("2026-09-13T20:25:00.000Z");
const lacPick = { source: "user", teamAbbr: "LAC", result: "pending" };

assert.equal(parseWeekParam(undefined), null);
assert.equal(parseWeekParam(""), null);
assert.equal(parseWeekParam("2"), 2);
assert.equal(parseWeekParam(["3", "1"]), 3);
assert.equal(parseWeekParam("nope"), null);

assert.equal(usesPlayerPickWeekDefault("/pick"), true);
assert.equal(usesPlayerPickWeekDefault("/scores"), true);
assert.equal(usesPlayerPickWeekDefault("/pool"), true);
assert.equal(usesPlayerPickWeekDefault("/videos"), true);
assert.equal(usesPlayerPickWeekDefault("/schedule"), false);

assert.equal(WEEK_NAV_PATHS["/scores"].allowFuture, false);
assert.equal(WEEK_NAV_PATHS["/pool"].allowFuture, false);
assert.equal(WEEK_NAV_PATHS["/schedule"].allowFuture, true);
assert.equal(WEEK_NAV_PATHS["/pick"].allowFuture, true);
assert.equal(WEEK_NAV_PATHS["/videos"].allowFuture, true);

assert.equal(
  resolveSelectedWeekNumber({
    requested: null,
    weekNumbers,
    currentWeek: 1,
    allowFuture: true,
  }),
  1
);
assert.equal(
  resolveSelectedWeekNumber({
    requested: 2,
    weekNumbers,
    currentWeek: 1,
    allowFuture: true,
  }),
  2
);
assert.equal(
  resolveSelectedWeekNumber({
    requested: 9,
    weekNumbers,
    currentWeek: 1,
    allowFuture: true,
  }),
  1,
  "unknown week falls back to current"
);
assert.equal(
  resolveSelectedWeekNumber({
    requested: 3,
    weekNumbers,
    currentWeek: 2,
    allowFuture: false,
  }),
  2,
  "future week is rejected when allowFuture is false"
);

// Robert still on Week 1 (MNF / his lock path not started) → Scores opens Week 1.
const robert = resolvePlayerPickWeek({
  poolCurrentWeek: 1,
  currentWeekLocked: true,
  existingCurrentPick: lacPick,
  existingCurrentGame: { status: "scheduled", kickoff: lacKickoff },
  nextWeekHasGames: true,
  nextWeekLocked: false,
  now: sunday,
});
assert.equal(robert.actionWeek, 1);
assert.equal(
  defaultWeekForPath({
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
  }),
  1,
  "Robert still on Week 1 → Scores defaults to Week 1"
);
assert.equal(
  resolvePageWeekNumber({
    requested: null,
    weekNumbers,
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
    allowFuture: false,
  }),
  1
);

// Already unlocked onto Week 2 picks → Scores opens Week 2 (not live Week 1).
const unlocked = resolvePlayerPickWeek({
  poolCurrentWeek: 1,
  currentWeekLocked: true,
  existingCurrentPick: lacPick,
  existingCurrentGame: { status: "live", kickoff: lacKickoff },
  nextWeekHasGames: true,
  nextWeekLocked: false,
  now: sunday,
});
assert.equal(unlocked.actionWeek, 2);
assert.equal(
  defaultWeekForPath({
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  2,
  "Week 2 pickers → Scores defaults to Week 2"
);
assert.equal(
  defaultWeekForPath({
    basePath: "/pick",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  2
);
assert.notEqual(
  defaultWeekForPath({
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  1,
  "do not bounce Week 2 pickers to live Week 1 on Scores"
);

assert.equal(
  resolvePageWeekNumber({
    requested: null,
    weekNumbers,
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  2
);

// Past weeks stay available on Scores.
assert.equal(
  resolvePageWeekNumber({
    requested: 1,
    weekNumbers,
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  1,
  "Scores ?week=1 still browses a past week"
);

// Future weeks are rejected on Scores (Schedule is the browser).
assert.equal(
  resolvePageWeekNumber({
    requested: 3,
    weekNumbers,
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  2,
  "Scores must not open a future week from ?week="
);
assert.equal(
  resolvePageWeekNumber({
    requested: 2,
    weekNumbers,
    basePath: "/scores",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
    allowFuture: false,
  }),
  1,
  "Week 1 pickers cannot open Week 2 on Scores"
);

// Week 1 game done + Week 2 TNF already started → Home still opens Week 2.
const afterTnf = resolvePlayerPickWeek({
  poolCurrentWeek: 1,
  currentWeekLocked: true,
  existingCurrentPick: { source: "imported", teamAbbr: "KC", result: "win" },
  existingCurrentGame: {
    status: "final",
    kickoff: new Date("2026-09-13T17:00:00.000Z"),
  },
  nextWeekHasGames: true,
  nextWeekLocked: true,
  now: new Date("2026-09-18T16:00:00.000Z"),
});
assert.equal(afterTnf.actionWeek, 2, "Gams after Week 1 final → Week 2");
assert.equal(
  defaultWeekForPath({
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: afterTnf.actionWeek,
  }),
  2,
  "Home defaults to Week 2 even when pool board week is still 1"
);
assert.equal(
  resolvePageWeekNumber({
    requested: 1,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: afterTnf.actionWeek,
    allowFuture: false,
  }),
  1,
  "Week 1 stays browsable as past on Home"
);
assert.equal(
  resolvePageWeekNumber({
    requested: 3,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: afterTnf.actionWeek,
    allowFuture: false,
  }),
  2,
  "Home must not open a future week"
);

// Schedule stays on the pool board week. Home matches Scores (pick week, no future).
assert.equal(
  defaultWeekForPath({
    basePath: "/schedule",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  1
);
assert.equal(
  resolvePageWeekNumber({
    requested: null,
    weekNumbers,
    basePath: "/schedule",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: true,
  }),
  1
);
assert.equal(
  defaultWeekForPath({
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  2,
  "Week 2 pickers → Home defaults to Week 2"
);
assert.equal(
  resolvePageWeekNumber({
    requested: null,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  2
);
assert.equal(
  resolvePageWeekNumber({
    requested: 1,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  1,
  "Home ?week=1 still browses a past week"
);
assert.equal(
  resolvePageWeekNumber({
    requested: 3,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: false,
  }),
  2,
  "Home must not open a future week from ?week="
);
assert.equal(
  resolvePageWeekNumber({
    requested: 2,
    weekNumbers,
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
    allowFuture: false,
  }),
  1,
  "Week 1 pickers cannot open Week 2 on Home"
);
assert.equal(
  defaultWeekForPath({
    basePath: "/pool",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
  }),
  1,
  "Robert still on Week 1 → Home defaults to Week 1"
);

assert.equal(
  defaultWeekForPath({
    basePath: "/videos",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  2,
  "Week 2 pickers → Videos defaults to Week 2"
);
assert.equal(
  defaultWeekForPath({
    basePath: "/videos",
    poolCurrentWeek: 1,
    pickActionWeek: robert.actionWeek,
  }),
  1,
  "Robert still on Week 1 → Videos defaults to Week 1"
);
assert.equal(
  resolvePageWeekNumber({
    requested: null,
    weekNumbers,
    basePath: "/videos",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: true,
  }),
  2,
  "Videos with no ?week= opens the current pick week"
);
assert.equal(
  resolvePageWeekNumber({
    requested: 1,
    weekNumbers,
    basePath: "/videos",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
    allowFuture: true,
  }),
  1,
  "Videos ?week=1 still browses a past week"
);
assert.notEqual(
  defaultWeekForPath({
    basePath: "/videos",
    poolCurrentWeek: 1,
    pickActionWeek: unlocked.actionWeek,
  }),
  1,
  "do not label live Week 1 as current on Videos for Week 2 pickers"
);

function mustInclude(path: string, needles: string[]) {
  const src = readFileSync(path, "utf8");
  for (const needle of needles) {
    assert.ok(src.includes(needle), `${path} must include ${needle}`);
  }
}

function mustNotMatch(path: string, pattern: RegExp, message: string) {
  const src = readFileSync(path, "utf8");
  assert.doesNotMatch(src, pattern, message);
}

mustInclude("src/lib/page-week.ts", [
  "resolvePlayerPickWeekFromLoaded",
  "resolvePageWeekNumber",
  "pickActionWeek: opts.actionWeek",
]);
mustInclude("src/components/features/scores/load-scores.ts", [
  'basePath: "/scores"',
  "actionWeek: decision.actionWeek",
  "allowFuture: false",
]);
mustNotMatch(
  "src/components/features/scores/ScoresScreen.tsx",
  /allowFuture\s*$/m,
  "Scores WeekSwitcher must not pass allowFuture (future weeks stay on Schedule)"
);
mustInclude("src/components/features/pick/load-pick.ts", [
  'basePath: "/pick"',
  "actionWeek: decision.actionWeek",
]);
mustInclude("src/components/features/home/load-home.ts", [
  'basePath: "/pool"',
  "actionWeek: decision.actionWeek",
  "allowFuture: false",
]);
mustInclude("src/components/features/videos/load-videos.ts", [
  'basePath: "/videos"',
  "actionWeek: decision.actionWeek",
  "allowFuture: true",
]);
mustInclude("src/components/features/videos/VideosScreen.tsx", [
  "currentWeek={props.focusWeek}",
]);
mustNotMatch(
  "src/components/features/home/HomeScreen.tsx",
  /allowFuture\s*$/m,
  "Home WeekSwitcher must not pass allowFuture (future weeks stay on Schedule)"
);
mustInclude("src/components/HeaderWeekNav.tsx", [
  "defaultWeekForPath",
  "resolvePageWeekNumber",
  "pickActionWeek",
]);
mustInclude("src/components/HelpContent.tsx", [
  "your current pick week",
  "Future weeks stay on",
]);
mustInclude("docs/HANDOFF.md", [
  "Home, Scores and Pick open on that friend’s current pick week",
  "future weeks stay on Schedule",
]);

mustNotMatch(
  "src/components/features/scores/load-scores.ts",
  /livePrior|showLivePrior|prior week on Scores/i,
  "Scores must not special-case live prior week for Week 2 pickers"
);

console.log("verify-weeks OK");
