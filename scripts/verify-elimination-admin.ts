/**
 * Admin elimination notify: copy, multi-admin union, dedupe dry-run.
 *
 *   npx tsx scripts/verify-elimination-admin.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  adminBlastDedupeKey,
  eliminationAdminCopy,
  eliminationEventDedupeKey,
  joinCanadianList,
  newEliminations,
  type EliminatedPlayer,
} from "../src/lib/elimination-admin-copy";
import {
  collectAdminEmails,
  collectAdminPhones,
  resetAdminUserIds,
} from "../src/lib/password-reset-notify";

function src(path: string) {
  return readFileSync(path, "utf8");
}

assert.equal(joinCanadianList(["Pauli"]), "Pauli");
assert.equal(joinCanadianList(["Pauli", "JaJa"]), "Pauli and JaJa");
assert.equal(
  joinCanadianList(["Pauli", "JaJa", "Gams"]),
  "Pauli, JaJa, and Gams"
);

const one = eliminationAdminCopy({ weekNumber: 2, nicknames: ["Pauli"] });
assert.equal(one.subject, "Survive Sunday — Pauli is out");
assert.match(one.text, /Pauli is out of the pool/);
assert.match(one.text, /Week 2/);
assert.match(one.text, /Enter a friend.s pick/);
assert.match(one.text, /If they had technical trouble/);
assert.match(one.smsBody ?? "", /Pauli is out/);

const two = eliminationAdminCopy({
  weekNumber: 2,
  nicknames: ["Pauli", "JaJa"],
});
assert.equal(two.subject, "Survive Sunday — 2 players are out");
assert.match(two.text, /Pauli and JaJa are out/);
assert.match(two.text, /If someone had technical trouble/);
console.log("PASS  admin copy names who went out");

const fresh = newEliminations([
  { beforeStatus: "one_loss", afterStatus: "eliminated", id: "a" },
  { beforeStatus: "undefeated", afterStatus: "one_loss", id: "b" },
  { beforeStatus: "eliminated", afterStatus: "eliminated", id: "c" },
]);
assert.deepEqual(
  fresh.map((e) => e.id),
  ["a"]
);
console.log("PASS  only new eliminations count");

const weekId = "week-2";
const pauli: EliminatedPlayer = {
  membershipId: "m-pauli",
  userId: "u-pauli",
  nickname: "Pauli",
};
const jaja: EliminatedPlayer = {
  membershipId: "m-jaja",
  userId: "u-jaja",
  nickname: "JaJa",
};

const claimed = new Set<string>();
function claimPass(people: EliminatedPlayer[]) {
  const next: EliminatedPlayer[] = [];
  for (const person of people) {
    const key = eliminationEventDedupeKey(weekId, person.membershipId);
    if (claimed.has(key)) continue;
    claimed.add(key);
    next.push(person);
  }
  return next;
}

const first = claimPass([pauli, jaja]);
assert.equal(first.length, 2, "first grading pass claims both");
assert.equal(
  adminBlastDedupeKey(weekId, first.map((p) => p.membershipId), "email"),
  adminBlastDedupeKey(weekId, ["m-jaja", "m-pauli"], "email"),
  "blast key ignores input order"
);
const replay = claimPass([pauli, jaja]);
assert.equal(replay.length, 0, "same elims do not notify again");
const later = claimPass([
  pauli,
  jaja,
  { membershipId: "m-gams", userId: "u-gams", nickname: "Gams" },
]);
assert.deepEqual(
  later.map((p) => p.nickname),
  ["Gams"],
  "a new elim in a later pass still notifies once"
);
console.log("PASS  dedupe dry-run (once per new elimination)");

assert.equal(
  collectAdminEmails([
    { email: "gams@example.com" },
    { email: "admin@survivesunday.demo" },
    { email: "gams@example.com" },
  ]).join(","),
  "gams@example.com"
);
assert.deepEqual(
  collectAdminPhones([
    { phoneE164: "+14165551212", email: "gams@example.com" },
    { phoneE164: "+14165559999", email: "seat@survivesunday.demo" },
    { phoneE164: "  ", email: "other@example.com" },
  ]),
  ["+14165551212"]
);
const union = resetAdminUserIds(
  [
    { userId: "is-admin", role: "member", isAdmin: true },
    { userId: "seat-admin", role: "admin", isAdmin: false },
  ],
  [{ userId: "grant-admin", role: "administrator" }]
).sort();
assert.equal(union.join(","), "grant-admin,is-admin,seat-admin");
console.log("PASS  same multi-admin model as password-reset");

const alert = src("src/lib/elimination-admin-alert.ts");
assert.match(alert, /loadPoolAdminUsers/);
assert.match(alert, /dispatchNotice/);
assert.match(alert, /claimNotificationSend/);
assert.match(alert, /admin_alert/);
assert.doesNotMatch(alert, /sendResendMessage|sendTwilioMessage/);
console.log("PASS  reuses dispatchNotice + NotificationSend; admin prefs gate the blast");

const grading = src("src/lib/grading.ts");
assert.match(grading, /scheduleAdminEliminationNotice/);
assert.match(grading, /newlyEliminated/);

const files = [
  "src/lib/elimination-admin-copy.ts",
  "src/lib/elimination-admin-alert.ts",
  "src/lib/password-reset-admins.ts",
  "src/lib/password-reset-notify.ts",
];
for (const file of files) {
  const lines = src(file).split("\n").length;
  assert.ok(lines <= 100, `${file} is ${lines} lines (max 100)`);
}

console.log("verify-elimination-admin OK");
