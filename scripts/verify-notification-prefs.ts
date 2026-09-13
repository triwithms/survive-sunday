/**
 * Notification preference defaults, patch parsing, and send gating.
 * Password-reset OTP stays ungated.
 *
 *   npx tsx scripts/verify-notification-prefs.ts
 */
import assert from "node:assert/strict";
import {
  NOTIFICATION_CATALOG,
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
  defaultNotificationPrefs,
  isNotificationEnabled,
  isUngatedMessageType,
  mergeNotificationPrefs,
  parsePrefPatch,
  prefsToFields,
  shouldSendMessage,
} from "../src/lib/notification-prefs";
import {
  mulliganEliminatedCopy,
  pickConfirmedCopy,
  resultsGradedCopy,
} from "../src/lib/notify-copy";
import { evaluatePickChange } from "../src/lib/pick-change";

const defaults = defaultNotificationPrefs();
assert.equal(defaults.missing_pick_reminder, true);
assert.equal(defaults.pick_confirmed, true);
assert.equal(defaults.results_graded, true);
assert.equal(defaults.mulligan_eliminated, true);
assert.equal(defaults.pool_announcements, true);
assert.equal(defaults.live_scores, false);
assert.equal(defaults.injury_notes, false);
assert.equal(NOTIFICATION_TYPES.length, 7);
assert.equal(NOTIFICATION_CATALOG.length, 7);
assert.deepEqual(prefsToFields(defaults).liveScores, false);
assert.deepEqual(prefsToFields(defaults).missingPickReminder, true);
console.log("PASS  defaults");

assert.deepEqual(
  mergeNotificationPrefs(null),
  defaults,
  "missing row uses defaults"
);
assert.equal(
  mergeNotificationPrefs({ liveScores: true }).live_scores,
  true,
  "stored override"
);
assert.equal(
  mergeNotificationPrefs({ liveScores: true }).pick_confirmed,
  true,
  "other keys stay default"
);
console.log("PASS  merge");

const patch = parsePrefPatch({ liveScores: true, injuryNotes: true });
assert.equal(patch.ok, true);
if (patch.ok) {
  assert.deepEqual(patch.patch, { liveScores: true, injuryNotes: true });
}
const snake = parsePrefPatch({ live_scores: true, pick_confirmed: false });
assert.equal(snake.ok, true);
if (snake.ok) {
  assert.equal(snake.patch.liveScores, true);
  assert.equal(snake.patch.pickConfirmed, false);
}
const nested = parsePrefPatch({ prefs: { missingPickReminder: false } });
assert.equal(nested.ok, true);
if (nested.ok) {
  assert.equal(nested.patch.missingPickReminder, false);
}
assert.equal(parsePrefPatch({ nope: true }).ok, false);
assert.equal(parsePrefPatch({ liveScores: "yes" }).ok, false);
assert.equal(parsePrefPatch(null).ok, false);
console.log("PASS  parse patch");

assert.equal(isNotificationEnabled(defaults, "live_scores"), false);
assert.equal(isNotificationEnabled(defaults, "pick_confirmed"), true);
assert.equal(
  shouldSendMessage({ type: "live_scores", prefs: defaults }),
  false
);
assert.equal(
  shouldSendMessage({
    type: "live_scores",
    prefs: { ...defaults, live_scores: true },
  }),
  true
);
assert.equal(
  shouldSendMessage({ type: "pick_confirmed", prefs: defaults }),
  true
);
assert.equal(
  shouldSendMessage({
    type: "pick_confirmed",
    prefs: { ...defaults, pick_confirmed: false },
  }),
  false
);
assert.equal(
  shouldSendMessage({ type: "password_reset", prefs: defaults }),
  true,
  "password reset ignores prefs"
);
assert.equal(
  shouldSendMessage({
    type: "password_reset",
    prefs: {
      ...defaults,
      pick_confirmed: false,
      missing_pick_reminder: false,
    },
  }),
  true,
  "password reset still sends when every pool toggle is off"
);
assert.equal(isUngatedMessageType("password_reset"), true);
assert.equal(isUngatedMessageType("pick_confirmed"), false);
assert.equal(shouldSendMessage({ type: "not-a-type", prefs: defaults }), false);
console.log("PASS  gating (password reset ungated)");

const pickCopy = pickConfirmedCopy({
  nickname: "Gams",
  weekNumber: 1,
  teamAbbr: "KC",
  changed: true,
});
assert.match(pickCopy.subject, /changed/);
assert.match(pickCopy.text, /KC/);
const gradeCopy = resultsGradedCopy({
  nickname: "Gams",
  weekNumber: 1,
  teamAbbr: "KC",
  result: "win",
});
assert.match(gradeCopy.subject, /win/);
const mulligan = mulliganEliminatedCopy({
  nickname: "Gams",
  status: "one_loss",
});
assert.match(mulligan.subject, /Mulligan/);
const out = mulliganEliminatedCopy({
  nickname: "Gams",
  status: "eliminated",
});
assert.match(out.subject, /eliminated/);
console.log("PASS  copy helpers");

const week1StillOpen = evaluatePickChange({
  weekNumber: 1,
  weekLocked: true,
  existingPick: { source: "user", teamAbbr: "LAC", result: "pending" },
  existingGame: {
    status: "scheduled",
    kickoff: new Date(Date.now() + 60_000),
  },
  newGame: {
    status: "scheduled",
    kickoff: new Date(Date.now() + 120_000),
  },
});
assert.equal(week1StillOpen.allowed, true);
assert.equal(week1StillOpen.reason, "week1_reopen");
console.log("PASS  Week 1 pick-change still allowed");

assert.equal(NOTIFICATION_DEFAULTS.injury_notes, false);
console.log("\nverify-notification-prefs OK");
