/**
 * Prove ensure-production-db stays green with leftover preview columns.
 * Destructive. Localhost only unless ALLOW_PROD_DB_MUTATION=1.
 *
 *   tsx scripts/_dangerous/verify-ensure-production-db.ts
 */
import { PrismaClient } from "@prisma/client";
import { assertNotProduction } from "../assert-not-production";
import { prismaDatasourceUrl } from "../../src/lib/prisma-url";
import {
  columnExists,
  ENSURE_SCRIPT,
  fail,
  run,
  tableExists,
} from "./verify-ensure-helpers";
import {
  cleanupLeftoverPreviewSchema,
  installLeftoverPreviewSchema,
} from "./verify-ensure-leftovers";

assertNotProduction("verify-ensure-production-db");

async function assertEnsureOutcome(prisma: PrismaClient) {
  const checks: Array<[boolean, string]> = [
    [await tableExists(prisma, "OtpChallenge"), "OtpChallenge was not created"],
    [!(await tableExists(prisma, "TwoFactorChallenge")), "TwoFactorChallenge leftover table was not dropped"],
    [await columnExists(prisma, "Pool", "singleEliminationFromWeek"), "other-PR Pool column was dropped"],
    [await columnExists(prisma, "Membership", "isParticipant"), "other-PR Membership column was dropped"],
    [await columnExists(prisma, "Membership", "playingFromWeek"), "other-PR Membership playingFromWeek column was dropped"],
    [await columnExists(prisma, "Pool", "mode"), "Pool.mode from Real mode was not added"],
    [await columnExists(prisma, "Membership", "isAdmin"), "Membership.isAdmin from the roles model was not added"],
    [await tableExists(prisma, "PoolAccessRole"), "PoolAccessRole table was not added"],
    [await tableExists(prisma, "NotificationPreference"), "NotificationPreference table was not added"],
    [await tableExists(prisma, "InviteToken"), "InviteToken table was not added"],
    [await columnExists(prisma, "Membership", "mirrorFromMembershipId"), "Membership.mirrorFromMembershipId was not added"],
    [await columnExists(prisma, "Membership", "pickBackup"), "Membership.pickBackup was not added"],
    [await columnExists(prisma, "Membership", "autoPickStamps"), "Membership.autoPickStamps was not added"],
  ];
  for (const [ok, msg] of checks) if (!ok) fail(msg);
}

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) fail("DATABASE_URL unset");
  const url = prismaDatasourceUrl(raw) ?? raw;
  const env = { ...process.env, DATABASE_URL: url };
  const prisma = new PrismaClient({ datasources: { db: { url } } });

  try {
    const synced = run("npx", ["prisma", "db", "push", "--skip-generate"], env);
    if (synced.status !== 0) fail("baseline prisma db push failed");
    await installLeftoverPreviewSchema(prisma);
    const blocked = run("npx", ["prisma", "db", "push", "--skip-generate"], env);
    if (blocked.status === 0) fail("expected prisma db push to refuse dropping other-PR columns");
    if (!/data loss|accept-data-loss|about to drop/i.test(blocked.output)) {
      fail(`db push failed for an unexpected reason:\n${blocked.output}`);
    }
    console.log("[verify-ensure-db] plain db push correctly refused data loss");
    const ensured = run("npx", ["tsx", ENSURE_SCRIPT], env);
    if (ensured.status !== 0) fail("ensure-production-db exited non-zero");
    await assertEnsureOutcome(prisma);
    const row = await prisma.otpChallenge.create({
      data: {
        email: "verify-ensure@survivesunday.demo",
        purpose: "password_reset",
        codeHash: "verify-hash",
        channel: "email",
        destination: "verify-ensure@survivesunday.demo",
        expiresAt: new Date(Date.now() + 60_000),
        lastSentAt: new Date(),
      },
    });
    await prisma.otpChallenge.delete({ where: { id: row.id } });
    console.log("[verify-ensure-db] ok — additive schema, leftover 2FA gone, extra columns kept");
  } finally {
    await cleanupLeftoverPreviewSchema(prisma);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
