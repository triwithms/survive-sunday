/**
 * Additive masterOn + channelsJson. Never drop leftover boolean columns.
 * One-shot v1: empty/legacy rows get product defaults. notifyPref=none → Off.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

const DEFAULT_JSON = JSON.stringify({
  missingPickReminder: "both",
  pickConfirmed: "email",
  resultsGraded: "email",
  eliminationMulligan: "both",
  poolAnnouncements: "email",
  scoreUpdates: "off",
  injuryNotes: "off",
});

export async function ensureTypeChannelPrefs(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationPreference"
      ADD COLUMN IF NOT EXISTS "masterOn" BOOLEAN NOT NULL DEFAULT true
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationPreference"
      ADD COLUMN IF NOT EXISTS "channelsJson" TEXT NOT NULL DEFAULT '{}'
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotifyTypePrefBackfill" (
      "id" TEXT NOT NULL,
      "doneAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "NotifyTypePrefBackfill_pkey" PRIMARY KEY ("id")
    )
  `);
  const marker = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "NotifyTypePrefBackfill" WHERE "id" = 'v1'
  `;
  if (marker.length === 0) {
    await backfillTypePrefDefaults(prisma);
    await prisma.$executeRawUnsafe(`
      INSERT INTO "NotifyTypePrefBackfill" ("id", "doneAt")
      VALUES ('v1', CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING
    `);
  }
  console.log("[ensure-db] NotificationPreference masterOn + channelsJson ready");
}

export async function backfillTypePrefDefaults(prisma: SchemaClient) {
  const json = DEFAULT_JSON.replace(/'/g, "''");
  await prisma.$executeRawUnsafe(`
    INSERT INTO "NotificationPreference" (
      "id", "userId",
      "missingPickReminder", "pickConfirmed", "resultsGraded",
      "eliminationMulligan", "poolAnnouncements", "scoreUpdates",
      "injuryNotes", "pushEnabled", "updatedAt",
      "masterOn", "channelsJson"
    )
    SELECT
      'np_' || u."id", u."id",
      true, true, true, true, true, false, false, false,
      CURRENT_TIMESTAMP,
      CASE WHEN u."notifyPref" = 'none' THEN false ELSE true END,
      '${json}'
    FROM "User" u
    WHERE NOT EXISTS (
      SELECT 1 FROM "NotificationPreference" np WHERE np."userId" = u."id"
    )
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "NotificationPreference" np
    SET
      "channelsJson" = '${json}',
      "masterOn" = CASE WHEN u."notifyPref" = 'none' THEN false ELSE true END
    FROM "User" u
    WHERE np."userId" = u."id"
      AND (np."channelsJson" IS NULL OR btrim(np."channelsJson") IN ('', '{}'))
  `);
}
