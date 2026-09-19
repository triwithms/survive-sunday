/**
 * Admin phone UX: three tabs, find user, Add user,
 * danger closed on System. No Demo / Who-are-you on Admin screens.
 *
 *   npx tsx scripts/verify-admin-phone-ux.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { confirmNicknameForSave } from "../src/components/features/admin/password-members";
import { rosterMatches } from "../src/components/features/admin/roster-row-meta";
import { auditDetail, auditTitle } from "../src/components/features/admin/audit-labels";
import { homeScreenStatusLine } from "../src/components/features/admin/home-screen-status";
import { ADMIN_TABS } from "../src/components/features/admin/admin-tabs";
import type { RosterMember } from "../src/components/features/admin/roster-types";

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function main() {
  const dir = "src/components/features/admin";
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const n = lineCount(join(dir, name));
    assert.ok(n <= 100, `${name} is ${n} lines (max 100)`);
  }

  assert.deepEqual(
    ADMIN_TABS.map((t) => t.label),
    ["Users", "Pool", "System"]
  );

  const nav = readFileSync(`${dir}/AdminNav.tsx`, "utf8");
  assert.match(nav, /grid-cols-3/);
  assert.match(nav, /min-h-11/);
  assert.match(nav, /whitespace-nowrap/);
  assert.doesNotMatch(nav, /overflow-x-auto/);

  assert.equal(confirmNicknameForSave(true, "", "Pauli"), "Pauli");
  assert.equal(confirmNicknameForSave(true, "nope", "Pauli"), "Pauli");
  assert.equal(confirmNicknameForSave(false, "", "Pauli"), "");
  assert.equal(confirmNicknameForSave(false, " Pauli ", "Pauli"), "Pauli");
  const passwordForm = readFileSync(`${dir}/use-password-form.ts`, "utf8");
  assert.match(passwordForm, /confirmNicknameForSave\(embedded/);
  const fields = readFileSync(`${dir}/SetPasswordFields.tsx`, "utf8");
  assert.match(fields, /lockMember \? null/);

  const users = readFileSync(`${dir}/UsersScreen.tsx`, "utf8");
  assert.match(users, /AddUserForm/);
  assert.doesNotMatch(users, /Who are you/i);
  assert.doesNotMatch(users, /AdminRolesPanel/);
  assert.doesNotMatch(users, /\bDemo\b/);

  const pool = readFileSync(`${dir}/ConfigScreen.tsx`, "utf8");
  assert.match(pool, /AdminRolesPanel/);
  assert.match(pool, /TransferCommissionerForm/);
  assert.match(pool, /Make administrator/);
  assert.match(pool, /Hand the pool/);

  const system = readFileSync(`${dir}/SystemScreen.tsx`, "utf8");
  assert.match(system, /system-danger/);
  assert.match(system, /ResetPoolPanel/);
  assert.match(system, /EnterPickForm/);
  assert.doesNotMatch(system, /PickCensusPanel/);
  assert.doesNotMatch(system, /AdminLockPanel/);
  assert.doesNotMatch(system, /AdminGradePanel/);
  assert.doesNotMatch(system, /CommissionerAccountPanel/);
  assert.doesNotMatch(system, /Unlock \(testing\)/);
  assert.doesNotMatch(system, /OpsPointers/);
  assert.doesNotMatch(system, /\bDemo\b/);

  const pauli: RosterMember = {
    id: "1",
    nickname: "Pauli",
    realName: "Paul Gama",
    status: "active",
    role: "member",
    email: "paul@example.com",
    phoneE164: null,
    mirrorFromMembershipId: null,
    pickBackup: null,
  };
  assert.equal(rosterMatches(pauli, ""), true);
  assert.equal(rosterMatches(pauli, "pau"), true);
  assert.equal(rosterMatches(pauli, "Gama"), true);
  assert.equal(rosterMatches(pauli, "jaja"), false);

  assert.equal(auditTitle("transfer_commissioner"), "Handed the pool");
  assert.equal(auditTitle("grant_admin"), "Made administrator");
  assert.equal(
    auditDetail(JSON.stringify({ nickname: "Pauli", note: "ok" })),
    "Pauli · ok"
  );
  assert.equal(
    homeScreenStatusLine("optout"),
    "This phone will not ask again."
  );

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: { build: string };
  };
  assert.equal(pkg.scripts.build, "next build");
  assert.doesNotMatch(pkg.scripts.build, /ensure-production-db/);

  console.log("PASS  Admin phone UX: 3 tabs, find, Add user, closed danger");
}

main();
