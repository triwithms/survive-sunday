/**
 * Channel gatekeeper: resolveChannels + planNotice (no database, no network).
 *
 *   npx tsx scripts/verify-notify-channels.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultNotifyPref, parseNotifyPrefBody } from "../src/lib/notify-pref";
import { resolveChannels } from "../src/lib/notify-channels";
import { planNotice } from "../src/lib/notify-plan";
import { destOnAllowlist, parseNotifyAllowlist, readNotifyMode } from "../src/lib/notify-mode";

function lineCount(path: string) {
  const text = readFileSync(path, "utf8");
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

const libFiles = [
  "src/lib/notify-pref.ts",
  "src/lib/notify-channels.ts",
  "src/lib/notify-mode.ts",
  "src/lib/notify-plan.ts",
  "src/lib/notify-log.ts",
  "src/lib/notify-dispatch.ts",
  "src/lib/notify-pref-schema.ts",
  "src/lib/notify-pref-db.ts",
  "src/lib/notify-pref-save.ts",
  "src/lib/notify-pref-columns.ts",
  "src/lib/notify-game-footer.ts",
  "src/lib/notify-type-schema.ts",
  "src/lib/notification-types.ts",
  "src/lib/notification-parse.ts",
  "src/lib/notification-labels.ts",
  "src/lib/notification-gates.ts",
  "src/lib/notification-prefs.ts",
  "src/lib/notify.ts",
  "src/lib/otp-notify.ts",
  "src/lib/notify-test-copy.ts",
  "src/lib/elimination-admin-alert.ts",
  "src/lib/password-reset-alert.ts",
  "src/lib/password-reset-deliver.ts",
];
for (const file of libFiles) {
  const n = lineCount(file);
  assert.ok(n <= 100, `${file} is ${n} lines (max 100)`);
}
for (const name of readdirSync("src/components/features/admin")) {
  if (!/\.(ts|tsx)$/.test(name)) continue;
  const path = join("src/components/features/admin", name);
  const n = lineCount(path);
  assert.ok(n <= 100, `${path} is ${n} lines (max 100)`);
}
console.log("PASS  file length");

assert.equal(defaultNotifyPref({ email: "pat@example.com" }), "email");
assert.equal(defaultNotifyPref({ email: null, phoneE164: "+14165551212" }), "none");
assert.equal(defaultNotifyPref({ email: "", phoneE164: null }), "none");
const parsed = parseNotifyPrefBody({ pref: "both" });
assert.equal(parsed.ok, true);
console.log("PASS  defaults never auto-opt into SMS");

const noneUser = { email: "pat@example.com", phoneE164: "+1", notifyPref: "none" };
assert.deepEqual(resolveChannels(noneUser, "game"), []);
assert.deepEqual(resolveChannels(noneUser, "security", ["email"]), ["email"]);
assert.deepEqual(resolveChannels({ notifyPref: "sms" }, "game"), ["sms"]);
assert.deepEqual(resolveChannels({ notifyPref: "email" }, "game"), ["email"]);
assert.deepEqual(resolveChannels({ notifyPref: "both" }, "admin_alert"), [
  "email",
  "sms",
]);
assert.deepEqual(
  resolveChannels(
    { masterOn: true, channels: { missingPickReminder: "both" } },
    "game",
    undefined,
    "missingPickReminder"
  ),
  ["email", "sms"]
);
assert.deepEqual(
  resolveChannels(
    { masterOn: true, channels: { pickConfirmed: "email" } },
    "game",
    undefined,
    "pickConfirmed"
  ),
  ["email"]
);
assert.deepEqual(
  resolveChannels(
    { masterOn: false, channels: { missingPickReminder: "both" } },
    "game",
    undefined,
    "missingPickReminder"
  ),
  []
);
assert.deepEqual(
  resolveChannels(
    { masterOn: true, channels: { scoreUpdates: "off" } },
    "game",
    undefined,
    "scoreUpdates"
  ),
  []
);
assert.deepEqual(
  resolveChannels(
    { masterOn: false, channels: { eliminationMulligan: "both" } },
    "admin_alert",
    undefined,
    "eliminationMulligan"
  ),
  ["email", "sms"]
);
console.log("PASS  resolveChannels categories");

const skipPref = planNotice({
  user: { email: "pat@example.com", notifyPref: "none" },
  category: "game",
});
assert.equal(skipPref[0]?.outcome, "skipped_pref");

const noCell = planNotice({
  user: { email: "pat@example.com", phoneE164: null, notifyPref: "sms" },
  category: "game",
});
assert.equal(noCell.length, 1);
assert.equal(noCell[0]?.outcome, "no_contact");
assert.equal(noCell[0]?.channel, "sms");

const dry = planNotice({
  user: { email: "pat@example.com", notifyPref: "email" },
  category: "game",
  env: { NOTIFY_MODE: "dryrun" },
});
assert.equal(dry[0]?.outcome, "dry_run");

const allow = planNotice({
  user: { email: "robert@example.com", notifyPref: "email" },
  category: "game",
  env: {
    NOTIFY_MODE: "allowlist",
    NOTIFY_ALLOWLIST: "robert@example.com,+14165550000",
  },
});
assert.equal(allow[0]?.outcome, "sent");

const blocked = planNotice({
  user: { email: "other@example.com", notifyPref: "email" },
  category: "game",
  env: {
    NOTIFY_MODE: "allowlist",
    NOTIFY_ALLOWLIST: "robert@example.com",
  },
});
assert.equal(blocked[0]?.outcome, "dry_run");

const resetNone = planNotice({
  user: { email: "pat@example.com", notifyPref: "none" },
  category: "security",
  requested: ["email"],
  env: { NOTIFY_MODE: "dryrun" },
});
assert.equal(resetNone[0]?.outcome, "sent", "SECURITY ignores prefs and NOTIFY_MODE");
console.log("PASS  planNotice outcomes");

assert.equal(readNotifyMode({ VERCEL_ENV: "preview" }), "dryrun");
assert.equal(readNotifyMode({ VERCEL_ENV: "production" }), "allowlist");
assert.equal(readNotifyMode({ NOTIFY_MODE: "live" }), "live");
const list = parseNotifyAllowlist("Robert@Example.com, +1 (416) 555-0000");
assert.equal(destOnAllowlist("robert@example.com", list), true);
assert.equal(destOnAllowlist("+14165550000", list), true);
console.log("PASS  NOTIFY_MODE defaults");

const dispatch = readFileSync("src/lib/notify-dispatch.ts", "utf8");
assert.match(dispatch, /planNotice/);
assert.match(dispatch, /sendResendMessage/);
assert.match(dispatch, /sendTwilioMessage/);
assert.match(dispatch, /withGameSmsFooter/);
assert.match(dispatch, /withGameEmailText/);
assert.match(dispatch, /withGameEmailHtml/);
assert.doesNotMatch(readFileSync("src/lib/otp-notify.ts", "utf8"), /withGameSmsFooter|withGameEmailText/);
assert.doesNotMatch(readFileSync("src/lib/elimination-admin-alert.ts", "utf8"), /sendResendMessage/);
assert.doesNotMatch(readFileSync("src/lib/password-reset-alert.ts", "utf8"), /sendResendMessage/);
assert.match(readFileSync("src/lib/password-reset-deliver.ts", "utf8"), /dispatchOtp/);
assert.match(readFileSync("src/lib/signin-otp.ts", "utf8"), /dispatchOtp/);
console.log("PASS  send paths go through the gatekeeper");

console.log("\nverify-notify-channels OK");
