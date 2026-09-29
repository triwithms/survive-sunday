/**
 * Delete-pool rules that must stay true without a database.
 *   npx tsx scripts/verify-delete-pool.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { INVITE_CODE } from "../src/lib/constants";
import {
  EXTERNAL_PICKS_DELETE_BLOCK,
  poolNameConfirmMatches,
  preferredPoolAfterDelete,
  slateOwnerDeleteBlock,
  type PoolAfterDelete,
} from "../src/lib/delete-pool-plan";

function pool(partial: Partial<PoolAfterDelete> & Pick<PoolAfterDelete, "id">): PoolAfterDelete {
  return {
    createdAt: "2026-09-01T00:00:00.000Z",
    inviteCode: "OTHER",
    mode: "live",
    slatePoolId: "family",
    ...partial,
  };
}

function assertConfirm() {
  assert.equal(poolNameConfirmMatches("JunkPoolForTrasj", "JunkPoolForTrasj"), true);
  assert.equal(poolNameConfirmMatches("  JunkPoolForTrasj  ", "JunkPoolForTrasj"), true);
  assert.equal(poolNameConfirmMatches("junkpoolfortrasj", "JunkPoolForTrasj"), false);
  assert.equal(poolNameConfirmMatches("JunkPoolForTrasj ", "JunkPoolForTrasj extra"), false);
  assert.equal(poolNameConfirmMatches("RESET", "JunkPoolForTrasj"), false);
  assert.equal(poolNameConfirmMatches("", "JunkPoolForTrasj"), false);
  assert.equal(poolNameConfirmMatches("   ", "   "), false);
}

function assertNextPool() {
  const family = pool({
    id: "family",
    inviteCode: INVITE_CODE,
    slatePoolId: null,
    createdAt: "2026-08-01T00:00:00.000Z",
  });
  const office = pool({
    id: "office",
    createdAt: "2026-09-20T00:00:00.000Z",
    slatePoolId: "family",
  });
  const olderLive = pool({
    id: "older-live",
    inviteCode: "LIVEOLD",
    slatePoolId: null,
    createdAt: "2026-07-01T00:00:00.000Z",
  });
  const newerCopy = pool({
    id: "newer-copy",
    createdAt: "2026-09-28T00:00:00.000Z",
  });
  const demo = pool({
    id: "demo",
    mode: "demo",
    slatePoolId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  });

  assert.equal(preferredPoolAfterDelete([], INVITE_CODE), null);
  assert.equal(
    preferredPoolAfterDelete([office, family], INVITE_CODE),
    "family"
  );
  assert.equal(
    preferredPoolAfterDelete([newerCopy, olderLive], INVITE_CODE),
    "older-live"
  );
  assert.equal(
    preferredPoolAfterDelete([demo, newerCopy], INVITE_CODE),
    "newer-copy"
  );
  assert.equal(preferredPoolAfterDelete([demo], INVITE_CODE), "demo");
  assert.equal(
    preferredPoolAfterDelete(
      [family, { ...family, createdAt: "2026-09-02T00:00:00.000Z" }],
      INVITE_CODE
    ),
    "family"
  );
}

function assertBlockCopy() {
  const one = slateOwnerDeleteBlock(["JunkPoolForTrasj"]);
  assert.match(one, /JunkPoolForTrasj/);
  assert.match(one, /was not deleted/);
  const many = slateOwnerDeleteBlock(["A", "B", "C", "D", "E", "F"]);
  assert.match(many, /A, B, C, D, E, and 1 more/);
  assert.match(slateOwnerDeleteBlock([]), /other pools/);
  assert.match(EXTERNAL_PICKS_DELETE_BLOCK, /was not deleted/);
}

function assertWiring() {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  assert.match(schema, /slatePool[\s\S]*onDelete: Restrict/);
  for (const model of [
    "model Membership",
    "model PoolAccessRole",
    "model Week",
    "model PoolInvite",
    "model WeekWrapSetting",
    "model AuditLog",
  ]) {
    const start = schema.indexOf(model);
    assert.ok(start >= 0, model);
    const body = schema.slice(start, start + 1800);
    assert.match(body, /onDelete: Cascade/, `${model} cascades from Pool`);
  }
  const pick = schema.slice(schema.indexOf("model Pick"), schema.indexOf("model NotificationPreference"));
  assert.match(pick, /onDelete: Cascade/);
  const game = schema.slice(schema.indexOf("model Game"), schema.indexOf("model Pick"));
  assert.match(game, /onDelete: Cascade/);

  const route = readFileSync("src/app/api/admin/delete-pool/route.ts", "utf8");
  assert.match(route, /requireAdmin/);
  assert.match(route, /admin\.membership\.poolId/);
  assert.match(route, /ACTIVE_POOL_COOKIE/);
  assert.doesNotMatch(route, /signIn\(/);

  const db = readFileSync("src/lib/delete-pool.ts", "utf8");
  assert.match(db, /slatePoolId: pool\.id/);
  assert.match(db, /tx\.pool\.delete/);
  assert.match(db, /gameId: null/);
  assert.doesNotMatch(db, /tx\.user\.delete/);

  const ui = [
    "src/components/features/admin/DeletePoolPanel.tsx",
    "src/components/features/admin/DeletePoolConfirm.tsx",
    "src/components/features/admin/use-delete-pool.ts",
  ]
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  assert.match(ui, /delete-pool-confirm/);
  assert.match(ui, /\/api\/logout/);
  assert.match(ui, /Type the pool name/);

  const screen = readFileSync("src/components/features/admin/ConfigScreen.tsx", "utf8");
  assert.ok(screen.indexOf("<ResetPoolPanel") < screen.indexOf("<DeletePoolPanel"));
  assert.match(screen, /pool-delete/);

  const help = readFileSync("src/components/features/help/HelpForAdmins.tsx", "utf8");
  assert.match(help, /Delete pool/);
  assert.match(help, /Type this pool/);
  assert.match(db, /INVITE_CODE/);
  assert.doesNotMatch(route + ui, /invite-code login|Who are you/);

  const handoff = readFileSync("docs/HANDOFF.md", "utf8");
  assert.match(handoff, /Delete pool/);
  const guide = readFileSync("docs/OPERATOR-ONBOARDING.md", "utf8");
  assert.match(guide, /Delete pool/);
  assert.match(guide, /email and password/);
  assert.doesNotMatch(guide, /@[a-z0-9.-]+\.[a-z]{2,}/i);
}

assertConfirm();
assertNextPool();
assertBlockCopy();
assertWiring();
console.log("verify-delete-pool OK");
