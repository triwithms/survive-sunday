/**
 * Prove ensure-production-db stays green when Neon already has leftover
 * columns from other preview PRs, and still creates OtpChallenge.
 *
 *   tsx scripts/verify-ensure-production-db.ts
 */
import { spawnSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";

function fail(message: string): never {
  console.error(`[verify-ensure-db] ${message}`);
  process.exit(1);
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { encoding: "utf8", env });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  if (output) process.stdout.write(output.endsWith("\n") ? output : `${output}\n`);
  return { status: result.status ?? 1, output };
}

async function columnExists(
  prisma: PrismaClient,
  table: string,
  column: string
) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = ${column}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

async function tableExists(prisma: PrismaClient, table: string) {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
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

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "singleEliminationFromWeek" INTEGER
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "isParticipant" BOOLEAN NOT NULL DEFAULT true
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TwoFactorChallenge" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        CONSTRAINT "TwoFactorChallenge_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "TwoFactorChallenge" ("id", "email")
      VALUES ('leftover-2fa', 'casey@example.com')
      ON CONFLICT ("id") DO NOTHING
    `);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "OtpChallenge" CASCADE`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Pool" DROP COLUMN IF EXISTS "mode"`);
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Membership" DROP COLUMN IF EXISTS "isAdmin"`
    );
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "PoolAccessRole" CASCADE`);

    const blocked = run("npx", ["prisma", "db", "push", "--skip-generate"], env);
    if (blocked.status === 0) {
      fail("expected prisma db push to refuse dropping other-PR columns");
    }
    if (!/data loss|accept-data-loss|about to drop/i.test(blocked.output)) {
      fail(`db push failed for an unexpected reason:\n${blocked.output}`);
    }
    console.log("[verify-ensure-db] plain db push correctly refused data loss");

    const ensured = run("npx", ["tsx", "scripts/ensure-production-db.ts"], env);
    if (ensured.status !== 0) fail("ensure-production-db exited non-zero");

    if (!(await tableExists(prisma, "OtpChallenge"))) {
      fail("OtpChallenge was not created");
    }
    if (await tableExists(prisma, "TwoFactorChallenge")) {
      fail("TwoFactorChallenge leftover table was not dropped");
    }
    if (!(await columnExists(prisma, "Pool", "singleEliminationFromWeek"))) {
      fail("other-PR Pool column was dropped");
    }
    if (!(await columnExists(prisma, "Membership", "isParticipant"))) {
      fail("other-PR Membership column was dropped");
    }
    if (!(await columnExists(prisma, "Pool", "mode"))) {
      fail("Pool.mode from Real mode was not added");
    }
    if (!(await columnExists(prisma, "Membership", "isAdmin"))) {
      fail("Membership.isAdmin from the roles model was not added");
    }
    if (!(await tableExists(prisma, "PoolAccessRole"))) {
      fail("PoolAccessRole table was not added");
    }

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
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Pool" DROP COLUMN IF EXISTS "singleEliminationFromWeek"`
    );
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Membership" DROP COLUMN IF EXISTS "isParticipant"`
    );
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TwoFactorChallenge" CASCADE`);
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
