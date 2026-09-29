/**
 * Pool join link is scoped, optional, and not invite-code login.
 *
 *   npx tsx scripts/verify-pool-invite.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { hashInviteToken } from "../src/lib/invite-token";
import {
  hashPoolInvite,
  mintPoolInviteSecret,
  parsePoolJoin,
  poolInvitePath,
} from "../src/lib/pool-invite";

process.env.AUTH_SECRET ||= "verify-pool-invite-secret";

function sqlStatements(sql: string): string {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");
}

function main() {
  const minted = mintPoolInviteSecret();
  assert.notEqual(minted.token, minted.tokenHash);
  assert.equal(hashPoolInvite(minted.token), minted.tokenHash);
  assert.notEqual(hashPoolInvite(minted.token), hashInviteToken(minted.token));
  assert.ok(minted.token.length >= 32);

  const path = poolInvitePath(minted.token);
  assert.match(path, /^\/join\/pool\?t=/);
  assert.doesNotMatch(path, /SUNDAY26|inviteCode|who=/);

  const bad = parsePoolJoin({ token: "x", email: "nope", password: "short", nickname: "" });
  assert.equal(bad.ok, false);
  const ok = parsePoolJoin({
    token: minted.token,
    email: " Pat@Example.com ",
    password: "sunday1",
    nickname: "Pat",
    poolId: "client-supplied",
  });
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.value.email, "pat@example.com");
    assert.equal(ok.value.nickname, "Pat");
    assert.equal("poolId" in ok.value, false);
  }

  const sql = sqlStatements(
    readFileSync("prisma/migrations/20260929161000_pool_invite_link/migration.sql", "utf8")
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "PoolInvite"/);
  assert.doesNotMatch(sql, /^(UPDATE|DELETE|DROP|TRUNCATE)\b/im);

  const joinRoute = readFileSync("src/app/api/join/pool/route.ts", "utf8");
  assert.doesNotMatch(joinRoute, /body\.poolId|inviteCode/);
  assert.match(joinRoute, /joinViaPoolInvite/);
  assert.match(joinRoute, /ACTIVE_POOL_COOKIE/);

  const adminRoute = readFileSync("src/app/api/admin/pool-invite/route.ts", "utf8");
  assert.match(adminRoute, /requireAdmin/);
  assert.match(adminRoute, /admin\.membership\.poolId/);
  assert.doesNotMatch(adminRoute, /body\.poolId/);

  const page = readFileSync("src/app/join/pool/page.tsx", "utf8");
  assert.doesNotMatch(page, /redirect\("\/login"\)/);
  assert.doesNotMatch(page, /Who are you|seats=/);
  assert.match(page, /PoolJoinForm/);

  const form = readFileSync("src/components/features/join/PoolJoinForm.tsx", "utf8");
  assert.match(form, /nickname/);
  assert.doesNotMatch(form, /inviteCode|Who are you|SUNDAY26/);

  const screen = readFileSync("src/components/features/admin/ConfigScreen.tsx", "utf8");
  assert.match(screen, /PoolInviteCard/);
  assert.doesNotMatch(screen, /Who are you/);

  const guide = readFileSync("docs/OPERATOR-ONBOARDING.md", "utf8");
  assert.match(guide, /Shared join link/);
  assert.match(guide, /Add user/);
  assert.match(guide, /email and password/);

  const join = readFileSync("src/lib/pool-invite-join.ts", "utf8");
  assert.match(join, /invite\.poolId/);
  assert.doesNotMatch(join, /body\.poolId|INVITE_CODE/);
  assert.match(join, /passwordsMatch/);

  console.log("PASS  pool invite link is scoped and optional");
}

main();
