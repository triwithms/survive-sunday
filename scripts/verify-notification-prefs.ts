/**
 * Notification preference defaults and send gates (no database, no network).
 *
 *   npx tsx scripts/verify-notification-prefs.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
import {
  GAME_EMAIL_FOOTER,
  GAME_SMS_FOOTER,
  withGameEmailHtml,
  withGameEmailText,
  withGameSmsFooter,
} from "../src/lib/notify-game-footer";

assert.equal(DEFAULT_NOTIFICATION_PREFS.missingPickReminder, "both");
assert.equal(DEFAULT_NOTIFICATION_PREFS.pickConfirmed, "email");
assert.equal(DEFAULT_NOTIFICATION_PREFS.resultsGraded, "email");
assert.equal(DEFAULT_NOTIFICATION_PREFS.weekWrap, "email");
assert.equal(DEFAULT_NOTIFICATION_PREFS.eliminationMulligan, "both");
assert.equal(DEFAULT_NOTIFICATION_PREFS.poolAnnouncements, "email");
assert.equal(DEFAULT_NOTIFICATION_PREFS.scoreUpdates, "off");
assert.equal(DEFAULT_NOTIFICATION_PREFS.injuryNotes, "off");
assert.equal(DEFAULT_NOTIFICATION_PREFS.masterOn, true);
assert.equal(DEFAULT_NOTIFICATION_PREFS.pushEnabled, false);
assert.equal(CORE_NOTIFICATION_TYPES.length, 6);
assert.equal(OPTIONAL_NOTIFICATION_TYPES.length, 2);
assert.equal(isNotificationType("missingPickReminder"), true);
assert.equal(isNotificationType("password_reset"), false);
assert.equal(isAccountRecoveryChannel("password_reset"), true);
assert.equal(isAccountRecoveryChannel("missingPickReminder"), false);
console.log("PASS  defaults + recovery never gated");

const merged = mergeNotificationPrefs({ scoreUpdates: "email" });
assert.equal(merged.scoreUpdates, "email");
assert.equal(merged.missingPickReminder, "both");
assert.equal(isTypeEnabled(undefined, "missingPickReminder"), true);
assert.equal(
  isTypeEnabled({ ...DEFAULT_NOTIFICATION_PREFS, resultsGraded: "off" }, "resultsGraded"),
  false
);
assert.equal(
  isTypeEnabled({ ...DEFAULT_NOTIFICATION_PREFS, masterOn: false }, "missingPickReminder"),
  false
);

const parsed = parsePreferencePatch({
  missingPickReminder: "off",
  pickConfirmed: "sms",
});
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.equal(parsed.prefs.missingPickReminder, "off");
  assert.equal(parsed.prefs.pickConfirmed, "sms");
  assert.equal(parsed.prefs.scoreUpdates, "off");
}
const stored = {
  ...DEFAULT_NOTIFICATION_PREFS,
  scoreUpdates: "sms" as const,
  pickConfirmed: "both" as const,
};
const masterOff = parsePreferencePatch({ masterOn: false }, stored);
assert.equal(masterOff.ok, true);
if (masterOff.ok) {
  assert.equal(masterOff.prefs.masterOn, false);
  assert.equal(masterOff.prefs.scoreUpdates, "sms");
  assert.equal(masterOff.prefs.pickConfirmed, "both");
}
const masterOn = parsePreferencePatch({ masterOn: true }, masterOff.ok ? masterOff.prefs : stored);
assert.equal(masterOn.ok, true);
if (masterOn.ok) {
  assert.equal(masterOn.prefs.masterOn, true);
  assert.equal(masterOn.prefs.scoreUpdates, "sms");
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
  prefs: { ...DEFAULT_NOTIFICATION_PREFS, missingPickReminder: "sms" },
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
  prefs: { ...DEFAULT_NOTIFICATION_PREFS, missingPickReminder: "email" },
});
assert.equal(smsOff.send, false);

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
assert.match(withGameSmsFooter(miss.smsBody ?? ""), /spam\/junk/);
assert.match(GAME_SMS_FOOTER, /Not junk/);
assert.match(GAME_SMS_FOOTER, /https:\/\/survive-sunday\.vercel\.app\/account\/notifications/);
assert.match(withGameEmailText(pick.text), /spam or junk/);
assert.match(withGameEmailHtml("<p>hi</p>"), /font-size:12px/);
assert.match(
  withGameEmailHtml("<p>hi</p>"),
  /href="https:\/\/survive-sunday\.vercel\.app\/account\/notifications"/
);
assert.match(GAME_EMAIL_FOOTER, /Not junk/);
assert.match(GAME_EMAIL_FOOTER, /account\/notifications/);
assert.doesNotMatch(GAME_EMAIL_FOOTER, /If you also get email/);
console.log("PASS  copy + GAME email/SMS footer");

assert.equal(isMissingNotificationSchema({ code: "P2021" }), true);
assert.match(PREFS_LOAD_ERROR, /defaults/i);
console.log("PASS  missing-schema detector");

const helpAccount = readFileSync("src/components/features/help/HelpAccount.tsx", "utf8");
assert.match(helpAccount, /Account → Notification preferences/);
assert.match(helpAccount, /Master On shows/);
assert.match(helpAccount, /Master Off hides that list/);
assert.match(helpAccount, /Email, SMS, both, or/);
assert.match(helpAccount, /spam\/junk/);
assert.doesNotMatch(helpAccount, /coming soon|Pick backup|pick backup/i);

const page = readFileSync("src/app/(app)/account/notifications/page.tsx", "utf8");
assert.match(page, /loadNotifyPref/);
assert.match(page, /Account \(header\) → Notification preferences/);
assert.match(page, /NotificationPrefsForm/);

const prefsForm = readFileSync(
  "src/components/features/account/NotificationPrefsForm.tsx",
  "utf8"
);
assert.match(prefsForm, /NotifyMasterToggle/);
assert.match(prefsForm, /NotifyTypeList/);
assert.match(prefsForm, /prefs\.masterOn \?/);
assert.match(prefsForm, /: null/);
assert.match(prefsForm, /Saved/);
assert.doesNotMatch(prefsForm, /Coming soon/);
assert.doesNotMatch(prefsForm, /notify-master-off/);
console.log("PASS  Account sheet link");

console.log("\nverify-notification-prefs OK");
