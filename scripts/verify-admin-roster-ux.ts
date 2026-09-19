/**
 * Admin Users roster is a compact list with one open editor,
 * and pick-backup radios are gone from the editor.
 *
 *   npx tsx scripts/verify-admin-roster-ux.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { memberCopyJoinUrl } from "../src/components/features/admin/copy-join";
import {
  backupShortLabel,
  claimShortLabel,
  rosterRowDetail,
  rosterRowSubtitle,
} from "../src/components/features/admin/roster-row-meta";
import type { RosterMember } from "../src/components/features/admin/roster-types";

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function assertCap(dir: string, cap = 100) {
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const path = join(dir, name);
    const n = lineCount(path);
    assert.ok(n <= cap, `${path} is ${n} lines (max ${cap})`);
  }
}

function member(partial: Partial<RosterMember>): RosterMember {
  return {
    id: "1",
    userId: "u-1",
    nickname: "Pauli",
    realName: "Paul Gama",
    status: "active",
    role: "member",
    email: "paul@example.com",
    phoneE164: null,
    notifyPref: "email",
    mirrorFromMembershipId: null,
    pickBackup: null,
    ...partial,
  };
}

function main() {
  assertCap("src/components/features/admin");

  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /input\[type="radio"\]/);
  assert.match(css, /input\[type="checkbox"\]/);
  assert.ok(css.includes("width: 1rem"), "radio/checkbox width 1rem");

  const editor = readFileSync(
    "src/components/features/admin/RosterEditor.tsx",
    "utf8"
  );
  assert.match(editor, /openId/);
  assert.match(editor, /id === m\.id \? null : m\.id/);
  assert.match(editor, /Tap a person/);
  assert.match(editor, /roster-search/);
  assert.match(editor, /Find a friend/);

  const radios = readFileSync("src/components/MirrorBackupRadios.tsx", "utf8");
  assert.match(radios, /Off — I’ll pick myself/);
  assert.match(radios, /Ranked auto/);
  assert.match(radios, /about 5 min/);
  assert.match(radios, /BackupRadioRow/);
  assert.doesNotMatch(radios, /Copy from a pool member|within 2 min|30 min/);

  const backupRow = readFileSync("src/components/BackupRadioRow.tsx", "utf8");
  assert.match(backupRow, /!w-4/);
  assert.match(backupRow, /min-w-0 flex-1/);
  assert.match(backupRow, /break-words/);

  const form = readFileSync("src/components/MirrorPicksForm.tsx", "utf8");
  assert.match(form, /Never overwrites/);
  assert.match(form, /💩/);
  assert.match(form, /cannot win the pool officially/);
  assert.match(form, /5 minutes before kickoff or lock/);
  assert.doesNotMatch(form, /Copy-from|30 minutes|2 minutes/);

  const users = readFileSync(
    "src/components/features/admin/UsersScreen.tsx",
    "utf8"
  );
  assert.match(users, /AddUserForm/);
  assert.match(users, /set a password you can text/);
  assert.doesNotMatch(users, /Who are you/);
  assert.doesNotMatch(users, /AdminRolesPanel/);
  assert.doesNotMatch(users, /on each roster card/);
  assert.doesNotMatch(users, /SetMemberPasswordForm members=\{props.passwordMembers\}/);

  const invite = readFileSync(
    "src/components/features/admin/InviteJoinButtons.tsx",
    "utf8"
  );
  assert.match(invite, /min-h-11/);
  assert.match(invite, /issueInviteToken/);
  assert.match(invite, /Copied invite link/);
  assert.match(invite, /shareOrCopy/);
  assert.match(invite, /Share2/);
  assert.match(invite, /role="status"/);

  const row = readFileSync(
    "src/components/features/admin/RosterRow.tsx",
    "utf8"
  );
  assert.match(row, /InviteJoinButtons/);
  assert.match(row, /Needs email to log in/);
  assert.doesNotMatch(row, /unclaimed \?/);

  const panel = readFileSync(
    "src/components/features/admin/UserEditPanel.tsx",
    "utf8"
  );
  assert.match(panel, /SetMemberPasswordForm/);
  assert.match(panel, /embedded/);
  assert.doesNotMatch(panel, /MirrorPicksForm/);
  assert.match(panel, /RosterContactFields/);
  assert.match(panel, /RosterNotifyPref/);
  assert.match(panel, /Save this person/);

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: { build: string };
  };
  assert.equal(pkg.scripts.build, "next build");

  assert.equal(
    rosterRowDetail(member({})),
    "Paul Gama · Joined"
  );
  assert.equal(
    rosterRowDetail(
      member({ email: "jaja@survivesunday.demo", realName: "Jacquie Gama" })
    ),
    "Jacquie Gama · Not joined"
  );
  assert.equal(
    rosterRowDetail(member({ role: "admin", realName: "Robert Gama" })),
    "Robert Gama · Administrator"
  );

  assert.equal(claimShortLabel(member({})), "Joined");
  assert.equal(
    claimShortLabel(member({ email: "jaja@survivesunday.demo" })),
    "Unclaimed"
  );
  assert.equal(backupShortLabel(member({})), "Ranked");
  assert.equal(
    backupShortLabel(
      member({ pickBackup: "mirror", mirrorFromMembershipId: "gams" }),
      "Gams"
    ),
    "Ranked"
  );
  assert.equal(
    backupShortLabel(member({ pickBackup: "ranked" })),
    "Ranked"
  );
  assert.equal(backupShortLabel(member({ pickBackup: "off" })), "Off");
  assert.equal(
    rosterRowSubtitle(member({ email: "jaja@survivesunday.demo" })),
    "Unclaimed · Ranked"
  );
  assert.match(
    memberCopyJoinUrl("seat-1", "JaJa", ["JaJa", "Gams"]),
    /join\?who=jaja/
  );

  console.log("PASS  Admin roster is compact + one editor; radios wrap");
}

main();
