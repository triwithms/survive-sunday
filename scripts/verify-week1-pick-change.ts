/**
 * Change a pending pick after week lock until that game’s kickoff (no database).
 *
 *   npx tsx scripts/verify-week1-pick-change.ts
 */
import assert from "node:assert/strict";
import {
  canEditExistingPick,
  evaluatePickChange,
  isGameStarted,
  isPendingUserPick,
  pickChangeErrorMessage,
  playerCanChangeCurrentPick,
} from "../src/lib/pick-change";

const sunday = new Date("2026-09-13T16:00:00.000Z");
const lacKickoff = new Date("2026-09-13T20:25:00.000Z");
const seaKickoff = new Date("2026-09-13T20:25:00.000Z");
const kcKickoff = new Date("2026-09-11T00:20:00.000Z");
const mnfKickoff = new Date("2026-09-15T00:15:00.000Z");

const lacScheduled = { status: "scheduled", kickoff: lacKickoff };
const seaScheduled = { status: "scheduled", kickoff: seaKickoff };
const kcFinal = { status: "final", kickoff: kcKickoff };
const lacLive = { status: "live", kickoff: lacKickoff };
const mnfScheduled = { status: "scheduled", kickoff: mnfKickoff };
const lacKickoffPassed = {
  status: "scheduled",
  kickoff: new Date("2026-09-13T15:00:00.000Z"),
};

const lacPick = { source: "user", teamAbbr: "LAC", result: "pending" };
const missedPick = { source: "missed", teamAbbr: "MISS", result: "loss" };
const importedLac = { source: "imported", teamAbbr: "LAC", result: "pending" };

assert.equal(isPendingUserPick(lacPick), true);
assert.equal(isPendingUserPick(importedLac), true);
assert.equal(isPendingUserPick(missedPick), false);
assert.equal(isPendingUserPick(null), false);
assert.equal(isGameStarted(lacScheduled, sunday), false);
assert.equal(isGameStarted(lacLive, sunday), true);
assert.equal(isGameStarted(kcFinal, sunday), true);
assert.equal(isGameStarted(lacKickoffPassed, sunday), true);

// Owner case: Week 1, LAC pending (not started) → switch to another not-started game.
const week1Switch = evaluatePickChange({
  weekNumber: 1,
  weekLocked: true,
  existingPick: lacPick,
  existingGame: lacScheduled,
  newGame: seaScheduled,
  now: sunday,
});
assert.deepEqual(week1Switch, { allowed: true, reason: "pending_reopen" });
assert.equal(
  canEditExistingPick({
    weekNumber: 1,
    weekLocked: true,
    existingPick: lacPick,
    existingGame: lacScheduled,
    now: sunday,
  }),
  true
);

// Imported official Week 1 pick can also change while the game is pending.
assert.equal(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: true,
    existingPick: importedLac,
    existingGame: lacScheduled,
    newGame: mnfScheduled,
    now: sunday,
  }).allowed,
  true
);

// Once LAC has kicked off they cannot change that LAC pick.
const lacStarted = evaluatePickChange({
  weekNumber: 1,
  weekLocked: true,
  existingPick: lacPick,
  existingGame: lacLive,
  newGame: mnfScheduled,
  now: sunday,
});
assert.deepEqual(lacStarted, {
  allowed: false,
  reason: "current_game_started",
});
assert.match(pickChangeErrorMessage(lacStarted.reason), /started/);

// Kickoff passed but ESPN still says scheduled — treat as started.
assert.equal(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: true,
    existingPick: lacPick,
    existingGame: lacKickoffPassed,
    newGame: mnfScheduled,
    now: sunday,
  }).reason,
  "current_game_started"
);

// Cannot move onto a live / final game.
assert.equal(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: true,
    existingPick: lacPick,
    existingGame: lacScheduled,
    newGame: kcFinal,
    now: sunday,
  }).reason,
  "new_game_started"
);

// First pick / missed pick after lock stays blocked (no Week-1 first-pick reopen).
assert.deepEqual(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: true,
    existingPick: null,
    existingGame: null,
    newGame: lacScheduled,
    now: sunday,
  }),
  { allowed: false, reason: "week_locked" }
);
assert.equal(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: true,
    existingPick: missedPick,
    existingGame: null,
    newGame: lacScheduled,
    now: sunday,
  }).reason,
  "week_locked"
);

// Week 2+ also reopens a pending pick when both games are still scheduled.
const week2Switch = evaluatePickChange({
  weekNumber: 2,
  weekLocked: true,
  existingPick: { source: "user", teamAbbr: "DET", result: "pending" },
  existingGame: { status: "scheduled", kickoff: mnfKickoff },
  newGame: mnfScheduled,
  now: sunday,
});
assert.deepEqual(week2Switch, { allowed: true, reason: "pending_reopen" });
assert.equal(
  canEditExistingPick({
    weekNumber: 2,
    weekLocked: true,
    existingPick: { source: "user", teamAbbr: "DET", result: "pending" },
    existingGame: { status: "scheduled", kickoff: mnfKickoff },
    now: sunday,
  }),
  true
);
assert.equal(
  evaluatePickChange({
    weekNumber: 3,
    weekLocked: true,
    existingPick: { source: "user", teamAbbr: "DET", result: "pending" },
    existingGame: { status: "live", kickoff: mnfKickoff },
    newGame: mnfScheduled,
    now: sunday,
  }).reason,
  "current_game_started"
);

// Before week lock, any week stays open (existing week-open path).
assert.equal(
  evaluatePickChange({
    weekNumber: 1,
    weekLocked: false,
    existingPick: lacPick,
    existingGame: lacScheduled,
    newGame: seaScheduled,
    now: sunday,
  }).reason,
  "week_open"
);
assert.equal(
  evaluatePickChange({
    weekNumber: 2,
    weekLocked: false,
    existingPick: null,
    existingGame: null,
    newGame: mnfScheduled,
    now: sunday,
  }).allowed,
  true
);

// Header / board CTA: player + pending LAC on Week 1 after lock.
assert.equal(
  playerCanChangeCurrentPick({
    weekNumber: 1,
    weekLocked: true,
    eliminated: false,
    isPlayer: true,
    existingPick: lacPick,
    existingGame: lacScheduled,
    now: sunday,
  }),
  true
);
assert.equal(
  playerCanChangeCurrentPick({
    weekNumber: 1,
    weekLocked: true,
    eliminated: true,
    isPlayer: true,
    existingPick: lacPick,
    existingGame: lacScheduled,
    now: sunday,
  }),
  false
);
assert.equal(
  playerCanChangeCurrentPick({
    weekNumber: 1,
    weekLocked: true,
    eliminated: false,
    isPlayer: false,
    existingPick: lacPick,
    existingGame: lacScheduled,
    now: sunday,
  }),
  false
);

console.log("verify-week1-pick-change OK");
