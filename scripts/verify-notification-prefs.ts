/**
 * Notification preference defaults and send gates (no database, no network).
 *
 *   npx tsx scripts/verify-notification-prefs.ts
 */
import assert from "node:assert/strict";
import {
  CORE_NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_PREFS,
  isAccountRecoveryChannel,
  isDemoRecipient,
  isMissingPickReminderWindow,
  isNotificationType,
  isTypeEnabled,
  mergeNotificationPrefs,
  OPTIONAL_NOTIFICATION_TYPES,
  parsePreferencePatch,
  shouldSendMissingPickSms,
  shouldSendPoolEmail,
} from "../src/lib/notification-types";
import {
  missingPickCopy,
  pickConfirmedCopy,
  resultsCopy,
} from "../src/lib/notification-copy";
import {
  isMissingNotificationSchema,
  PREFS_LOAD_ERROR,
} from "../src/lib/notification-schema";
import { readFileSync } from "node:fs";

assert.equal(DEFAULT_NOTIFICATION_PREFS.missingPickReminder, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.pickConfirmed, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.resultsGraded, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.eliminationMulligan, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.poolAnnouncements, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.scoreUpdates, false);
assert.equal(DEFAULT_NOTIFICATION_PREFS.injuryNotes, false);
assert.equal(DEFAULT_NOTIFICATION_PREFS.pushEnabled, false);
assert.equal(CORE_NOTIFICATION_TYPES.length, 5);
assert.equal(OPTIONAL_NOTIFICATION_TYPES.length, 2);
assert.equal(isNotificationType("missingPickReminder"), true);
assert.equal(isNotificationType("password_reset"), false);
assert.equal(isAccountRecoveryChannel("password_reset"), true);
assert.equal(isAccountRecoveryChannel("missingPickReminder"), false);
console.log("PASS  defaults + recovery never gated");

const merged = mergeNotificationPrefs({ scoreUpdates: true });
assert.equal(merged.scoreUpdates, true);
assert.equal(merged.missingPickReminder, true);
assert.equal(isTypeEnabled(undefined, "missingPickReminder"), true);
assert.equal(isTypeEnabled({ ...DEFAULT_NOTIFICATION_PREFS, resultsGraded: false }, "resultsGraded"), false);

const parsed = parsePreferencePatch({
  missingPickReminder: false,
  pickConfirmed: true,
});
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.prefs.missingPickReminder, false);
  assert.equal(parsed.prefs.scoreUpdates, false);
}
const bad = parsePreferencePatch({ missingPickReminder: "nope" });
assert.equal(bad.ok, false);
console.log("PASS  merge + parse");

assert.equal(isDemoRecipient("gams@survivesunday.demo"), true);
assert.equal(isDemoRecipient("robertgama@gmail.com"), false);

const emailOn = shouldSendPoolEmail({
  email: "pat@example.com",
  prefs: DEFAULT_NOTIFICATION_PREFS,
  type: "missingPickReminder",
});
assert.deepEqual(emailOn, { send: true, reason: "ok" });

const emailOff = shouldSendPoolEmail({
  email: "pat@example.com",
  prefs: { ...DEFAULT_NOTIFICATION_PREFS, missingPickReminder: false },
  type: "missingPickReminder",
});
assert.equal(emailOff.send, false);
assert.equal(emailOff.reason, "pref-off");

const demoSkip = shouldSendPoolEmail({
  email: "pauli@survivesunday.demo",
  prefs: DEFAULT_NOTIFICATION_PREFS,
  type: "resultsGraded",
});
assert.equal(demoSkip.send, false);

const noisyDefault = shouldSendPoolEmail({
  email: "pat@example.com",
  prefs: DEFAULT_NOTIFICATION_PREFS,
  type: "scoreUpdates",
});
assert.equal(noisyDefault.send, false);
assert.equal(noisyDefault.reason, "pref-off");

const smsOff = shouldSendMissingPickSms({
  phoneE164: "+14165551234",
  prefs: { ...DEFAULT_NOTIFICATION_PREFS, missingPickReminder: false },
});
assert.equal(smsOff.send, false);
assert.equal(smsOff.reason, "pref-off");

const smsOn = shouldSendMissingPickSms({
  phoneE164: "+14165551234",
  prefs: DEFAULT_NOTIFICATION_PREFS,
});
assert.equal(smsOn.send, true);
console.log("PASS  email/SMS gates");

const now = new Date("2026-09-10T16:00:00.000Z");
assert.equal(
  isMissingPickReminderWindow(new Date("2026-09-10T20:00:00.000Z"), now),
  true
);
assert.equal(
  isMissingPickReminderWindow(new Date("2026-09-12T20:00:00.000Z"), now),
  false
);
assert.equal(
  isMissingPickReminderWindow(new Date("2026-09-10T15:00:00.000Z"), now),
  false
);

const pick = pickConfirmedCopy({
  nickname: "Gams",
  weekNumber: 1,
  teamAbbr: "KC",
  changed: true,
});
assert.match(pick.subject, /changed/i);
assert.match(pick.text, /KC/);

const grade = resultsCopy({
  nickname: "Pauli",
  weekNumber: 1,
  teamAbbr: "BUF",
  result: "loss",
  status: "one_loss",
  mulliganBurned: true,
});
assert.match(grade.subject, /mulligan/i);

const miss = missingPickCopy({
  nickname: "Go Giants",
  weekNumber: 1,
  lockLabel: "Thu 8:15 p.m.",
});
assert.match(miss.smsBody ?? "", /no Week 1 pick/);
console.log("PASS  copy");

assert.equal(isMissingNotificationSchema({ code: "P2021" }), true);
assert.equal(isMissingNotificationSchema({ code: "P2022" }), true);
assert.equal(
  isMissingNotificationSchema(new Error("The table `public.NotificationPreference` does not exist in the current database.")),
  true
);
assert.equal(isMissingNotificationSchema(new Error("unrelated")), false);
assert.equal(
  isMissingNotificationSchema(new Error("permission denied for table NotificationPreference")),
  true
);
assert.match(PREFS_LOAD_ERROR, /defaults/i);
console.log("PASS  missing-schema detector");

const accountMenu = readFileSync("src/components/AccountMenu.tsx", "utf8");
assert.match(accountMenu, /href="\/account\/notifications"/);
assert.match(accountMenu, /Notification preferences/);
assert.match(
  readFileSync("src/app/(app)/account/notifications/page.tsx", "utf8"),
  /ensureNotificationPrefsSafe/
);
assert.match(
  readFileSync("src/app/(app)/account/notifications/page.tsx", "utf8"),
  /Account \(header\) → Notification preferences/
);
console.log("PASS  Account sheet link");

console.log("\nverify-notification-prefs OK");
