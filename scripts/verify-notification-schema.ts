/**
 * Recover Account → Notification preferences when the prefs table is
 * missing or missing columns (the production 500).
 *
 *   npx tsx scripts/verify-notification-schema.ts
 *
 * Skips the database half when DATABASE_URL is unset.
 */
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { prismaDatasourceUrl } from "../src/lib/prisma-url";
import {
  ensureNotificationTables,
  isMissingNotificationSchema,
} from "../src/lib/notification-schema";
import { DEFAULT_NOTIFICATION_PREFS } from "../src/lib/notification-types";

assert.equal(isMissingNotificationSchema({ code: "P2021" }), true);
assert.equal(isMissingNotificationSchema({ code: "P2022" }), true);
console.log("PASS  detector");

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

async function main() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.log("SKIP  DATABASE_URL unset — detector-only");
    return;
  }
  const url = prismaDatasourceUrl(raw) ?? raw;
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const email = `verify-notif-schema-${Date.now()}@survivesunday.demo`;
  try {
    await prisma.$executeRawUnsafe(
      `DROP TABLE IF EXISTS "NotificationPreference" CASCADE`
    );
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "NotificationPreference" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
      )
    `);
    assert.equal(
      await columnExists(prisma, "NotificationPreference", "pushEnabled"),
      false
    );

    await ensureNotificationTables(prisma);
    assert.equal(
      await columnExists(prisma, "NotificationPreference", "pushEnabled"),
      true
    );
    assert.equal(
      await columnExists(prisma, "NotificationPreference", "injuryNotes"),
      true
    );
    assert.equal(
      await columnExists(prisma, "NotificationPreference", "scoreUpdates"),
      true
    );

    const user = await prisma.user.create({
      data: { email, name: "Verify Notif Schema" },
    });
    const row = await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...DEFAULT_NOTIFICATION_PREFS },
      update: {},
    });
    assert.equal(row.missingPickReminder, true);
    assert.equal(row.pushEnabled, false);
    await prisma.notificationPreference.delete({ where: { id: row.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("PASS  stub table + missing columns recover; upsert works");
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("\nverify-notification-schema OK");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
