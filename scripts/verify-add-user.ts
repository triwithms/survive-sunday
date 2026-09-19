/**
 * Admin Add user parse + Admin folder still ≤100 lines.
 *
 *   npx tsx scripts/verify-add-user.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import {
  deriveAddUserNickname,
  parseAddUser,
  placeholderEmailFor,
} from "../src/lib/add-user";

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
  assert.ok(lineCount("src/lib/add-user.ts") <= 100);
  assert.ok(lineCount("src/lib/add-user-db.ts") <= 100);
  assert.ok(lineCount("src/lib/add-user-prep.ts") <= 100);
  assert.ok(lineCount("src/app/api/admin/add-user/route.ts") <= 100);

  const empty = parseAddUser({});
  assert.equal(empty.ok, false);

  const parsed = parseAddUser({
    realName: "Sam Gama",
    email: " Sam@Example.com ",
    invite: true,
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.nickname, "Sam");
    assert.equal(parsed.value.email, "sam@example.com");
    assert.equal(parsed.value.invite, true);
  }

  const commish = parseAddUser({ nickname: "Commissioner" });
  assert.equal(commish.ok, false);

  assert.equal(deriveAddUserNickname({ nickname: "", realName: "Paul Gama", email: "" }), "Paul");
  assert.match(placeholderEmailFor("Pauli", "ab12"), /@pending\.survivesunday\.local$/);

  const users = readFileSync(`${dir}/UsersScreen.tsx`, "utf8");
  assert.match(users, /AddUserForm/);
  assert.match(users, /RosterEditor/);
  const fields = readFileSync(`${dir}/AddUserFields.tsx`, "utf8");
  assert.match(fields, /RosterNotifySoon/);
  assert.match(fields, /add-user-invite/);
  assert.match(fields, /SetPasswordKind/);

  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: { build: string };
  };
  assert.equal(pkg.scripts.build, "next build");
  assert.doesNotMatch(pkg.scripts.build, /ensure-production-db/);

  console.log("PASS  Add user parse + Admin file cap");
}

main();
