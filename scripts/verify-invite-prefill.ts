/**
 * Invite login prefill: hashed token only, no raw PII in the URL.
 *
 *   npx tsx scripts/verify-invite-prefill.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { inviteLoginPath } from "../src/lib/invite-token";
import {
  INVITE_EXPIRED_MESSAGE,
  safeInvitePrefill,
} from "../src/lib/invite-prefill";

function lineCount(path: string): number {
  const text = readFileSync(path, "utf8");
  if (!text) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function assertCap(dir: string) {
  for (const name of readdirSync(dir)) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const n = lineCount(join(dir, name));
    assert.ok(n <= 100, `${join(dir, name)} is ${n} lines (max 100)`);
  }
}

function main() {
  assertCap("src/components/features/login");
  assertCap("src/components/features/admin");
  assert.ok(lineCount("src/lib/invite-prefill.ts") <= 100);
  assert.ok(lineCount("src/lib/invite-prefill-db.ts") <= 100);
  assert.ok(lineCount("src/lib/invite-token.ts") <= 100);
  assert.ok(lineCount("src/app/api/login/invite/route.ts") <= 100);
  assert.ok(lineCount("src/app/actions/issue-invite-token.ts") <= 100);
  assert.ok(lineCount("src/lib/user-email-schema.ts") <= 100);

  const path = inviteLoginPath("tok+en");
  assert.equal(path, "/login?invite=tok%2Ben");
  assert.doesNotMatch(path, /@|email=|cell=|nickname=|password=/i);

  assert.equal(
    INVITE_EXPIRED_MESSAGE,
    "Invite link expired — ask your Administrator for a new one."
  );
  assert.match(INVITE_EXPIRED_MESSAGE, /Administrator/);
  assert.doesNotMatch(INVITE_EXPIRED_MESSAGE, /Commissioner/);

  const prefill = safeInvitePrefill({
    email: " Sam@Example.com ",
    nickname: " Pauli ",
  });
  assert.equal(prefill.email, "Sam@Example.com");
  assert.equal(prefill.nickname, "Pauli");

  const route = readFileSync("src/app/api/login/invite/route.ts", "utf8");
  assert.match(route, /loadInvitePrefill/);
  assert.doesNotMatch(route, /signIn|passwordHash|cookies\(/);

  const db = readFileSync("src/lib/invite-prefill-db.ts", "utf8");
  assert.match(db, /peekInviteToken/);
  assert.doesNotMatch(db, /consumeInviteToken/);
  assert.doesNotMatch(db, /password/);

  const issue = readFileSync("src/app/actions/issue-invite-token.ts", "utf8");
  assert.match(issue, /inviteLoginPath/);
  assert.doesNotMatch(issue, /inviteJoinPath/);

  const form = readFileSync(
    "src/components/features/login/LoginForm.tsx",
    "utf8"
  );
  assert.match(form, /useInvitePrefill/);
  assert.match(form, /name="password"/);
  assert.doesNotMatch(form, /defaultValue=\{.*password/);

  console.log("PASS  Invite prefill is token-only and file-capped");
}

main();
