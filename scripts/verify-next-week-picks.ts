/**
 * Per-player next-week pick unlock (no database).
 *
 *   npx tsx scripts/verify-next-week-picks.ts
 */
import assert from "node:assert/strict";
import {
  homeEmptyPickCopy,
  isPlayerPickWeek,
  nextWeekOpenHeadline,
  pickScreenCopy,
  playerPickWeekError,
  resolvePlayerPickWeek,
  resolvePlayerPickWeekFromLoaded,
} from "../src/lib/next-week-picks";
import { boardCta } from "../src/components/features/board/board-copy";

const sunday = new Date("2026-09-13T16:00:00.000Z");
const lacKickoff = new Date("2026-09-13T20:25:00.000Z");
const mnfKickoff = new Date("2026-09-15T00:15:00.000Z");

const lacScheduled = { status: "scheduled", kickoff: lacKickoff };
const lacLive = { status: "live", kickoff: lacKickoff };
const mnfScheduled = { status: "scheduled", kickoff: mnfKickoff };
const lacPick = { source: "user", teamAbbr: "LAC", result: "pending" };
const missedPick = { source: "missed", teamAbbr: "MISS", result: "loss" };
const importedLac = { source: "imported", teamAbbr: "LAC", result: "pending" };

function week1Open(over: Partial<Parameters<typeof resolvePlayerPickWeek>[0]> = {}) {
  return resolvePlayerPickWeek({
    poolCurrentWeek: 1,
    currentWeekLocked: true,
    existingCurrentPick: lacPick,
    existingCurrentGame: lacScheduled,
    nextWeekHasGames: true,
    nextWeekLocked: false,
    now: sunday,
    ...over,
  });
}

// Still waiting on their own Week 1 game — stay on Week 1. Do not open Week 2.
const pending = week1Open();
assert.equal(pending.actionWeek, 1, "pending Week 1 stays on Week 1");
assert.equal(pending.nextWeekOpen, false, "do not open Week 2 before their kickoff");
assert.equal(pending.canStillPlayCurrentWeek, true);
assert.equal(pending.reason, "current_game_pending");
assert.equal(isPlayerPickWeek(pending, 1), true);
assert.equal(isPlayerPickWeek(pending, 2), false);
assert.match(playerPickWeekError(pending, 2), /opens after your Week 1 game starts/);

// Imported official pick, game not started — same Week 1 flow.
assert.equal(
  week1Open({ existingCurrentPick: importedLac }).actionWeek,
  1,
  "imported pending pick stays on Week 1"
);

// Their Week 1 game has started — Week 2 opens immediately (MNF still upcoming).
const started = week1Open({ existingCurrentGame: lacLive });
assert.equal(started.actionWeek, 2, "game started → Week 2");
assert.equal(started.nextWeekOpen, true);
assert.equal(started.canStillPlayCurrentWeek, false);
assert.equal(started.reason, "current_pick_locked");
assert.equal(isPlayerPickWeek(started, 2), true);
assert.equal(isPlayerPickWeek(started, 1), false);
assert.match(playerPickWeekError(started, 1), /Week 1 is closed for you/);
assert.equal(
  nextWeekOpenHeadline(2, true),
  "Week 2 is open — make your pick"
);

// Kickoff time passed (ESPN still scheduled) — treat as started.
assert.equal(
  week1Open({
    existingCurrentGame: {
      status: "scheduled",
      kickoff: new Date("2026-09-13T15:00:00.000Z"),
    },
  }).nextWeekOpen,
  true,
  "kickoff passed unlocks Week 2"
);

// Missed / empty Week 1 after lock (new joiner or no pick path) → Week 2.
const missed = week1Open({
  existingCurrentPick: missedPick,
  existingCurrentGame: null,
});
assert.equal(missed.actionWeek, 2);
assert.equal(missed.nextWeekOpen, true);
assert.equal(missed.reason, "current_week_closed");

const noPick = week1Open({
  existingCurrentPick: null,
  existingCurrentGame: null,
});
assert.equal(noPick.actionWeek, 2, "empty Week 1 after lock → Week 2");
assert.equal(noPick.nextWeekOpen, true);
assert.equal(homeEmptyPickCopy(noPick).missed, false);
assert.equal(
  homeEmptyPickCopy(noPick).message,
  "Week 2 is open — make your pick"
);
assert.equal(
  homeEmptyPickCopy(noPick).ctaLabel,
  "Make your pick"
);

// Brand-new player with playingFromWeek=2.
const late = week1Open({
  playingFromWeek: 2,
  existingCurrentPick: null,
  existingCurrentGame: null,
});
assert.equal(late.reason, "late_start");
assert.equal(late.actionWeek, 2);
assert.equal(late.nextWeekOpen, true);

// Week 1 still unlocked — first pick stays on Week 1; do not jump to Week 2.
const openWeek = resolvePlayerPickWeek({
  poolCurrentWeek: 1,
  currentWeekLocked: false,
  existingCurrentPick: null,
  existingCurrentGame: null,
  nextWeekHasGames: true,
  nextWeekLocked: false,
  now: sunday,
});
assert.equal(openWeek.actionWeek, 1);
assert.equal(openWeek.nextWeekOpen, false);
assert.equal(openWeek.reason, "current_week_open");
assert.equal(homeEmptyPickCopy(openWeek).ctaLabel, "Pick now");

// Slate missing — wait copy, not a fake pickable week.
const waiting = week1Open({
  existingCurrentGame: lacLive,
  nextWeekHasGames: false,
});
assert.equal(waiting.actionWeek, 2);
assert.equal(waiting.nextWeekOpen, false);
assert.equal(waiting.reason, "slate_not_ready");
assert.equal(isPlayerPickWeek(waiting, 2), false);
assert.match(playerPickWeekError(waiting, 2), /aren’t listed yet/);
assert.match(
  nextWeekOpenHeadline(2, false),
  /aren’t listed yet/
);

// Next week already locked (TNF) — cannot pick it, but Home still focuses there.
const nextLocked = week1Open({
  existingCurrentGame: lacLive,
  nextWeekLocked: true,
});
assert.equal(nextLocked.actionWeek, 2, "TNF lock does not pin Home to Week 1");
assert.equal(nextLocked.nextWeekOpen, false);
assert.equal(nextLocked.reason, "next_week_locked");
assert.equal(isPlayerPickWeek(nextLocked, 2), false);

// Board week still 1 + Week 2 TNF locked + pending Sunday pick → still changeable.
const sundayKick = new Date("2026-09-20T17:00:00.000Z");
const friday = new Date("2026-09-18T23:30:00.000Z");
const gamsWeek2 = resolvePlayerPickWeek({
  poolCurrentWeek: 1,
  currentWeekLocked: true,
  existingCurrentPick: { source: "imported", teamAbbr: "KC", result: "win" },
  existingCurrentGame: {
    status: "final",
    kickoff: new Date("2026-09-13T17:00:00.000Z"),
  },
  existingNextPick: { source: "user", teamAbbr: "DET", result: "pending" },
  existingNextGame: { status: "scheduled", kickoff: sundayKick },
  nextWeekHasGames: true,
  nextWeekLocked: true,
  now: friday,
});
assert.equal(gamsWeek2.actionWeek, 2, "Gams stays on Week 2 after TNF");
assert.equal(gamsWeek2.nextWeekOpen, false, "first pick after lock stays closed");
assert.equal(gamsWeek2.reason, "next_game_pending");
assert.equal(isPlayerPickWeek(gamsWeek2, 2), true);
assert.equal(isPlayerPickWeek(gamsWeek2, 1), false);
const gamsCopy = pickScreenCopy({
  weekNumber: 2,
  decision: gamsWeek2,
  locked: true,
  canChange: true,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.equal(gamsCopy.showWeek1ChangeCard, true);
assert.match(gamsCopy.kicker, /until your game starts/);
assert.equal(homeEmptyPickCopy(gamsWeek2).ctaLabel, "Change pick");

const fromLoadedLockedNext = resolvePlayerPickWeekFromLoaded({
  poolCurrentWeek: 1,
  currentPick: { source: "imported", teamAbbr: "KC", result: "win" },
  nextPick: { source: "user", teamAbbr: "DET", result: "pending" },
  weeks: [
    {
      number: 1,
      locked: true,
      games: [
        {
          id: "kc",
          status: "final",
          kickoff: new Date("2026-09-13T17:00:00.000Z"),
          awayAbbr: "LAC",
          homeAbbr: "KC",
        },
      ],
    },
    {
      number: 2,
      locked: true,
      games: [
        {
          id: "det",
          status: "scheduled",
          kickoff: sundayKick,
          awayAbbr: "CHI",
          homeAbbr: "DET",
        },
      ],
    },
  ],
  now: friday,
});
assert.equal(fromLoadedLockedNext.reason, "next_game_pending");
assert.equal(isPlayerPickWeek(fromLoadedLockedNext, 2), true);
assert.deepEqual(
  boardCta({
    canChangePick: false,
    showMakePick: false,
    showMutedChange: false,
    weekNumber: 1,
    decision: gamsWeek2,
    adminSpectator: false,
  }),
  { href: "/pick?week=2", label: "Change pick" }
);

// Final pick, week row not locked (lock override / lag) — still leave Week 1.
const finalUnlocked = week1Open({
  currentWeekLocked: false,
  existingCurrentPick: { source: "imported", teamAbbr: "KC", result: "win" },
  existingCurrentGame: {
    status: "final",
    kickoff: new Date("2026-09-13T17:00:00.000Z"),
  },
  now: new Date("2026-09-18T16:00:00.000Z"),
});
assert.equal(finalUnlocked.actionWeek, 2, "own game final → Week 2 even if week unlocked");
assert.equal(finalUnlocked.canStillPlayCurrentWeek, false);

// Loaded-weeks helper: MNF still scheduled does not block Week 2.
const fromLoaded = resolvePlayerPickWeekFromLoaded({
  poolCurrentWeek: 1,
  currentPick: lacPick,
  weeks: [
    {
      number: 1,
      locked: true,
      games: [
        { id: "lac", status: "live", kickoff: lacKickoff, awayAbbr: "LAC", homeAbbr: "KC" },
        { id: "mnf", status: "scheduled", kickoff: mnfKickoff, awayAbbr: "NYJ", homeAbbr: "BUF" },
      ],
    },
    {
      number: 2,
      locked: false,
      games: [
        { id: "w2", status: "scheduled", kickoff: new Date("2026-09-18T00:15:00.000Z"), awayAbbr: "DET", homeAbbr: "BUF" },
      ],
    },
  ],
  now: sunday,
});
assert.equal(fromLoaded.nextWeekOpen, true, "MNF leftover is not the unlock");
assert.equal(fromLoaded.actionWeek, 2);

// Pick screen: Week 2 open is the obvious action, not “future week”.
const week2Copy = pickScreenCopy({
  weekNumber: 2,
  decision: started,
  locked: false,
  canChange: true,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.equal(week2Copy.kicker, "Week 2 is open — make your pick");
assert.equal(week2Copy.banner, null);
assert.equal(week2Copy.showDismissibleTip, true);
assert.equal(week2Copy.showWeek1ChangeCard, false);

const week1ClosedCopy = pickScreenCopy({
  weekNumber: 1,
  decision: started,
  locked: true,
  canChange: false,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.equal(week1ClosedCopy.kicker, "Your Week 1 pick is locked.");
assert.equal(week1ClosedCopy.banner?.title, "Week 2 is open — make your pick");
assert.equal(week1ClosedCopy.banner?.href, "/pick?week=2");

const newJoinerCopy = pickScreenCopy({
  weekNumber: 1,
  decision: noPick,
  locked: true,
  canChange: false,
  eliminated: false,
  spectator: false,
  hasCurrentPick: false,
});
assert.equal(newJoinerCopy.kicker, "Week 1 is closed for you.");
assert.equal(newJoinerCopy.banner?.title, "Week 2 is open — make your pick");

const stillWeek1Copy = pickScreenCopy({
  weekNumber: 1,
  decision: pending,
  locked: true,
  canChange: true,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.equal(stillWeek1Copy.showWeek1ChangeCard, true);
assert.match(stillWeek1Copy.kicker, /until your game starts/);
assert.doesNotMatch(stillWeek1Copy.kicker, /Week 1 only/);

const week2Pending = resolvePlayerPickWeek({
  poolCurrentWeek: 2,
  currentWeekLocked: true,
  existingCurrentPick: { source: "user", teamAbbr: "DET", result: "pending" },
  existingCurrentGame: mnfScheduled,
  nextWeekHasGames: true,
  nextWeekLocked: false,
  now: sunday,
});
assert.equal(week2Pending.actionWeek, 2, "pending Week 2 stays on Week 2");
assert.equal(week2Pending.nextWeekOpen, false);
assert.equal(week2Pending.canStillPlayCurrentWeek, true);
assert.equal(week2Pending.reason, "current_game_pending");

const stillWeek2Copy = pickScreenCopy({
  weekNumber: 2,
  decision: week2Pending,
  locked: true,
  canChange: true,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.equal(stillWeek2Copy.showWeek1ChangeCard, true);
assert.match(stillWeek2Copy.kicker, /until your game starts/);
assert.doesNotMatch(stillWeek2Copy.kicker, /Week 1 only/);

const week2Started = resolvePlayerPickWeek({
  poolCurrentWeek: 2,
  currentWeekLocked: true,
  existingCurrentPick: { source: "user", teamAbbr: "DET", result: "pending" },
  existingCurrentGame: { status: "live", kickoff: mnfKickoff },
  nextWeekHasGames: true,
  nextWeekLocked: false,
  now: sunday,
});
assert.equal(week2Started.actionWeek, 3, "Week 2 game started → Week 3");
assert.equal(week2Started.nextWeekOpen, true);
assert.equal(week2Started.canStillPlayCurrentWeek, false);
assert.equal(week2Started.reason, "current_pick_locked");

const browsingEarly = pickScreenCopy({
  weekNumber: 2,
  decision: pending,
  locked: false,
  canChange: false,
  eliminated: false,
  spectator: false,
  hasCurrentPick: true,
});
assert.match(browsingEarly.banner?.title ?? "", /isn’t open for picks yet/);
assert.match(browsingEarly.banner?.body ?? "", /after your Week 1 game starts/);

console.log("verify-next-week-picks OK");
