/**
 * Admin Users can edit nickname, full name, email, and cell.
 * Notification prefs stay disabled until send works.
 *
 *   npx tsx scripts/verify-admin-user-profile.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  CELL_ALREADY_USED,
  EMAIL_ALREADY_USED,
  isCellTakenByOther,
  isEmailTakenByOther,
  nicknameTaken,
  parseRosterProfile,
} from "../src/lib/roster-profile";
import { uniqueContactFail } from "../src/lib/contact-taken";
import { rosterDraftDirty } from "../src/components/features/admin/use-roster-edit";
import { rosterMatches } from "../src/components/features/admin/roster-row-meta";
import {
  isVisibleAdminPerson,
  toRosterMembers,
} from "../src/components/features/admin/map-roster";
import type { RosterMember } from "../src/components/features/admin/roster-types";
import type { MemberRow } from "../src/components/features/admin/types";

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function assertCap(dir: string, cap = 100) {
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const n = lineCount(join(dir, name));
    assert.ok(n <= cap, `${join(dir, name)} is ${n} lines (max ${cap})`);
  }
}

const member: RosterMember = {
  id: "1",
  nickname: "Pauli",
  realName: "Paul Gama",
  status: "active",
  role: "member",
  email: "paul@example.com",
  phoneE164: "+14165551234",
  mirrorFromMembershipId: null,
  pickBackup: null,
};

function main() {
  assertCap("src/components/features/admin");
  assert.ok(lineCount("src/lib/roster-profile.ts") <= 100);
  assert.ok(lineCount("src/lib/roster-profile-db.ts") <= 100);
  assert.ok(lineCount("src/lib/contact-taken.ts") <= 100);
  assert.ok(lineCount("src/lib/contact-taken-db.ts") <= 100);
  assert.ok(lineCount("src/app/api/admin/roster/route.ts") <= 100);

  const empty = parseRosterProfile({});
  assert.equal(empty.ok, false);

  const parsed = parseRosterProfile({
    membershipId: "seat-1",
    nickname: "Pauli",
    realName: "Paul Gama",
    email: " Paul@Example.com ",
    phone: "(416) 555-1234",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.email, "paul@example.com");
    assert.equal(parsed.value.phoneE164, "+14165551234");
    assert.equal(parsed.value.realName, "Paul Gama");
  }

  const noPhone = parseRosterProfile({
    membershipId: "seat-1",
    nickname: "Pauli",
    email: "paul@example.com",
    phone: "",
  });
  assert.equal(noPhone.ok, true);
  if (noPhone.ok) assert.equal(noPhone.value.phoneE164, null);

  const badPhone = parseRosterProfile({
    membershipId: "seat-1",
    nickname: "Pauli",
    email: "paul@example.com",
    phone: "555",
  });
  assert.equal(badPhone.ok, false);

  assert.equal(
    nicknameTaken([{ id: "1", nickname: "Pauli" }, { id: "2", nickname: "Gams" }], "1", "gams"),
    true
  );
  assert.equal(
    isEmailTakenByOther("u1", "paul@example.com", "paul@example.com", { id: "u1" }),
    false
  );
  assert.equal(
    isEmailTakenByOther("u1", "paul@example.com", "other@example.com", { id: "u2" }),
    true
  );
  assert.equal(
    isCellTakenByOther("u1", "+14165551234", "+14165551234", { id: "u1" }),
    false
  );
  assert.equal(
    isCellTakenByOther("u1", "+14165551234", "+14165550000", { id: "u2" }),
    true
  );
  assert.equal(isCellTakenByOther("u1", "+14165551234", null, { id: "u2" }), false);
  assert.equal(isCellTakenByOther("u1", null, "+14165551234", { id: "u1" }), false);
  assert.equal(isCellTakenByOther("", null, "+14165551234", { id: "u2" }), true);
  assert.equal(EMAIL_ALREADY_USED, "That email is already used");
  assert.equal(CELL_ALREADY_USED, "That cell is already used.");
  assert.equal(
    uniqueContactFail(new Error("Unique constraint failed on the fields: (`User_email`)"))
      ?.error,
    EMAIL_ALREADY_USED
  );

  assert.match(
    readFileSync("src/lib/roster-profile-db.ts", "utf8"),
    /rosterContactClash/
  );
  assert.match(readFileSync("src/lib/add-user-db.ts", "utf8"), /addUserContactClash/);
  assert.doesNotMatch(
    readFileSync("src/lib/roster-profile-db.ts", "utf8"),
    /already has an account/
  );
  assert.doesNotMatch(
    readFileSync("src/lib/add-user-db.ts", "utf8"),
    /already has an account/
  );

  assert.equal(rosterMatches(member, "416"), true);
  assert.equal(rosterDraftDirty( {
    nickname: "Pauli",
    realName: "Paul Gama",
    email: "paul@example.com",
    phone: "+1 (416) 555-1234",
  }, member), false);

  const panel = readFileSync("src/components/features/admin/UserEditPanel.tsx", "utf8");
  assert.match(panel, /RosterContactFields/);
  assert.match(panel, /RosterNotifySoon/);
  assert.match(panel, /SetMemberPasswordForm/);
  assert.doesNotMatch(panel, /Who are you/i);

  const soon = readFileSync("src/components/features/admin/RosterNotifySoon.tsx", "utf8");
  assert.match(soon, /Coming soon — notifications not sending yet/);
  assert.match(soon, /disabled/);
  assert.match(soon, /NotifyChannelSelect/);
  assert.doesNotMatch(soon, /onSave|fetch\(/);

  const fields = readFileSync("src/components/features/admin/RosterCardFields.tsx", "utf8");
  assert.match(fields, /Full name/);

  const spectator: MemberRow = {
    id: "admin-1",
    userId: "u-admin",
    nickname: "Commissioner",
    realName: "Robert Gama",
    status: "undefeated",
    role: "admin",
    pickBackup: null,
    mirrorFromMembershipId: null,
    user: { email: "admin@survivesunday.demo", phoneE164: null },
  };
  const gams: MemberRow = {
    ...spectator,
    id: "gams-1",
    userId: "u-gams",
    nickname: "Gams",
    role: "member",
    user: { email: "gams@survivesunday.demo", phoneE164: null },
  };
  const roster = toRosterMembers([spectator, gams]);
  assert.equal(roster.length, 1);
  assert.equal(roster[0].nickname, "Gams");
  assert.equal(isVisibleAdminPerson(spectator), false);
  assert.equal(isVisibleAdminPerson(gams), true);
  assert.equal(
    isVisibleAdminPerson({ role: "member", nickname: "Commissioner" }),
    false
  );
  assert.doesNotMatch(
    readFileSync("src/lib/demo-account.ts", "utf8"),
    /nickname: "Commissioner"/
  );
  assert.doesNotMatch(
    readFileSync("prisma/seed.ts", "utf8"),
    /nickname: "Commissioner"/
  );
  assert.match(
    readFileSync("src/lib/reset-pool.ts", "utf8"),
    /if \(m\.role === "admin"\) continue/
  );

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: { build: string };
  };
  assert.equal(pkg.scripts.build, "next build");
  assert.doesNotMatch(pkg.scripts.build, /ensure-production-db/);

  console.log("PASS  Admin can edit identity fields; notify prefs stay coming-soon");
}

main();
