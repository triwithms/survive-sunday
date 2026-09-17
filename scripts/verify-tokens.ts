/**
 * Invite + API token crypto (HMAC via AUTH_SECRET). No database.
 *
 *   npx tsx scripts/verify-tokens.ts
 */
import assert from "node:assert/strict";
import {
  inviteIsUsable,
  inviteJoinPath,
  inviteSecretsMatch,
  mintInviteSecret,
} from "../src/lib/invite-token";
import { mintApiToken, verifyApiToken, bearerToken } from "../src/lib/api-token";
import { cronAuthorized } from "../src/lib/cron-auth";

process.env.AUTH_SECRET ||= "verify-tokens-secret";

function req(headers: Record<string, string>) {
  return new Request("http://localhost/api/cron/ensure-week", { headers });
}

const minted = mintInviteSecret();
assert.match(minted.token, /^[A-Za-z0-9_-]+$/);
assert.equal(minted.tokenHash.length, 64);
assert.equal(inviteSecretsMatch(minted.token, minted.tokenHash), true);
assert.equal(inviteSecretsMatch("nope", minted.tokenHash), false);
assert.equal(inviteSecretsMatch(` ${minted.token} `, minted.tokenHash), true);
assert.equal(
  inviteIsUsable({ expiresAt: minted.expiresAt, consumedAt: null }),
  true
);
assert.equal(
  inviteIsUsable({ expiresAt: new Date(Date.now() - 1000), consumedAt: null }),
  false
);
assert.equal(
  inviteIsUsable({ expiresAt: minted.expiresAt, consumedAt: new Date() }),
  false
);
assert.equal(inviteJoinPath("abc+d"), "/join?t=abc%2Bd");

const now = Date.now();
const cron = mintApiToken("cron", 60_000, now);
assert.ok(verifyApiToken(cron, "cron", now));
assert.equal(verifyApiToken(cron, "api", now), null);
assert.equal(verifyApiToken(cron, "cron", now + 120_000), null);
const tampered = cron.slice(0, -2) + (cron.endsWith("aa") ? "bb" : "aa");
assert.equal(verifyApiToken(tampered, "cron", now), null);
assert.ok(verifyApiToken(mintApiToken("api", 1000, now), "api", now));

const prevCron = process.env.CRON_SECRET;
process.env.CRON_SECRET = "cron-test-secret";
assert.equal(cronAuthorized(req({ "x-vercel-cron": "1" })), true);
assert.equal(cronAuthorized(req({ authorization: "Bearer cron-test-secret" })), true);
assert.equal(cronAuthorized(req({ authorization: `Bearer ${cron}` })), true);
assert.equal(cronAuthorized(req({ authorization: "Bearer nope" })), false);
assert.equal(cronAuthorized(req({})), false);
assert.equal(bearerToken(req({ authorization: "Bearer abc" })), "abc");
if (prevCron === undefined) delete process.env.CRON_SECRET;
else process.env.CRON_SECRET = prevCron;

console.log("verify-tokens OK");
