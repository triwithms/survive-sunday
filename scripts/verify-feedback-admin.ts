/**
 * Report a bug / idea notifies every Administrator (no hardcoded inbox).
 *
 *   npx tsx scripts/verify-feedback-admin.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  FEEDBACK_MAX_LEN,
  feedbackAdminNotifyCopy,
  parseFeedbackMessage,
} from "../src/lib/feedback-admin-copy";
import { resetAdminUserIds } from "../src/lib/password-reset-notify";

function src(path: string) {
  return readFileSync(path, "utf8");
}

const parsed = parseFeedbackMessage({ message: "  Kickoff times look off.  " });
assert.equal(parsed.ok, true);
if (parsed.ok) assert.equal(parsed.message, "Kickoff times look off.");
assert.equal(parseFeedbackMessage({ message: "   " }).ok, false);
assert.equal(parseFeedbackMessage({}).ok, false);
assert.equal(
  parseFeedbackMessage({ message: "x".repeat(FEEDBACK_MAX_LEN + 1) }).ok,
  false
);

const copy = feedbackAdminNotifyCopy(
  "Pauli",
  "Scores froze on Sunday.",
  "pauli@example.com"
);
assert.equal(copy.subject, "Survive Sunday — bug or idea");
assert.match(copy.text, /Pauli \(pauli@example.com\) sent a bug or idea/);
assert.match(copy.text, /Scores froze on Sunday/);
assert.match(copy.smsBody ?? "", /Pauli sent a bug or idea/);
assert.doesNotMatch(copy.smsBody ?? "", /Scores froze/);
const anon = feedbackAdminNotifyCopy("JaJa", "Add a dark row.");
assert.match(anon.text, /JaJa sent a bug or idea/);
assert.doesNotMatch(anon.text, /@/);
console.log("PASS  copy names the friend and keeps SMS short");

const union = resetAdminUserIds(
  [
    { userId: "is-admin", role: "member", isAdmin: true },
    { userId: "seat-admin", role: "admin", isAdmin: false },
  ],
  [{ userId: "grant-admin", role: "administrator" }]
).sort();
assert.equal(union.join(","), "grant-admin,is-admin,seat-admin");
console.log("PASS  same multi-admin union as password-reset");

const alert = src("src/lib/feedback-admin-alert.ts");
assert.match(alert, /loadResetNotifyContext/);
assert.match(alert, /dispatchNotice/);
assert.match(alert, /admin_alert/);
assert.match(alert, /bug_report_admin/);
assert.doesNotMatch(alert, /sendResendMessage|sendTwilioMessage|robertgama@gmail.com/);
const route = src("src/app/api/account/report/route.ts");
assert.match(route, /deliverFeedbackAdminNotice/);
assert.match(route, /parseFeedbackMessage/);
assert.doesNotMatch(route, /robertgama@gmail.com/);
const hub = src("src/components/features/account/AccountHubLinks.tsx");
assert.match(hub, /FEEDBACK_PATH/);
assert.doesNotMatch(hub, /mailto:/);
console.log("PASS  reuses admin roster + dispatchNotice; no hardcoded inbox");

const files = [
  "src/lib/feedback-admin-copy.ts",
  "src/lib/feedback-admin-alert.ts",
  "src/app/api/account/report/route.ts",
  "src/components/features/account/ReportBugForm.tsx",
  "src/app/(app)/account/report/page.tsx",
];
for (const file of files) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

console.log("verify-feedback-admin OK");
