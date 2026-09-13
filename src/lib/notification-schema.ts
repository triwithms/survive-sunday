/**
 * Additive NotificationPreference + NotificationSend tables.
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

export async function ensureNotificationTables(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotificationPreference" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "missingPickReminder" BOOLEAN NOT NULL DEFAULT true,
      "pickConfirmed" BOOLEAN NOT NULL DEFAULT true,
      "resultsGraded" BOOLEAN NOT NULL DEFAULT true,
      "eliminationMulligan" BOOLEAN NOT NULL DEFAULT true,
      "poolAnnouncements" BOOLEAN NOT NULL DEFAULT true,
      "scoreUpdates" BOOLEAN NOT NULL DEFAULT false,
      "injuryNotes" BOOLEAN NOT NULL DEFAULT false,
      "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key"
    ON "NotificationPreference" ("userId")
  `);
  const prefFk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'NotificationPreference_userId_fkey'
  `;
  if (prefFk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "NotificationPreference"
        ADD CONSTRAINT "NotificationPreference_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotificationSend" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "dedupeKey" TEXT NOT NULL,
      "channel" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "NotificationSend_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSend_userId_type_dedupeKey_key"
    ON "NotificationSend" ("userId", "type", "dedupeKey")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NotificationSend_userId_createdAt_idx"
    ON "NotificationSend" ("userId", "createdAt")
  `);
  const sendFk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'NotificationSend_userId_fkey'
  `;
  if (sendFk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "NotificationSend"
        ADD CONSTRAINT "NotificationSend_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  console.log("[ensure-db] NotificationPreference + NotificationSend ready");
}
