import { PrismaClient } from "@prisma/client";

export async function installLeftoverPreviewSchema(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "singleEliminationFromWeek" INTEGER
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "isParticipant" BOOLEAN NOT NULL DEFAULT true
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "playingFromWeek" INTEGER
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
}

export async function cleanupLeftoverPreviewSchema(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Pool" DROP COLUMN IF EXISTS "singleEliminationFromWeek"`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Membership" DROP COLUMN IF EXISTS "isParticipant"`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Membership" DROP COLUMN IF EXISTS "playingFromWeek"`
  );
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TwoFactorChallenge" CASCADE`);
}
