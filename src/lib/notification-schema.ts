/**
 * Additive NotificationPreference + NotificationSend tables.
 * Preview + production share Neon — never drop leftover columns.
 *
 * CREATE TABLE IF NOT EXISTS is not enough: an older stub table (or a
 * deploy that created the table before later columns shipped) stays
 * incomplete. Prisma then 500s on Account → Notification preferences.
 * Always ADD COLUMN IF NOT EXISTS after create.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

const PREF_COLUMNS: Array<{ name: string; sql: string }> = [
  { name: "id", sql: `TEXT` },
  { name: "userId", sql: `TEXT` },
  { name: "missingPickReminder", sql: `BOOLEAN NOT NULL DEFAULT true` },
  { name: "pickConfirmed", sql: `BOOLEAN NOT NULL DEFAULT true` },
  { name: "resultsGraded", sql: `BOOLEAN NOT NULL DEFAULT true` },
  { name: "eliminationMulligan", sql: `BOOLEAN NOT NULL DEFAULT true` },
  { name: "poolAnnouncements", sql: `BOOLEAN NOT NULL DEFAULT true` },
  { name: "scoreUpdates", sql: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "injuryNotes", sql: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "pushEnabled", sql: `BOOLEAN NOT NULL DEFAULT false` },
  { name: "updatedAt", sql: `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP` },
];

export const PREFS_LOAD_ERROR =
  "Couldn’t load saved preferences from the database. Showing defaults. Tap Save after a refresh — if this stays, Account → Notification preferences still needs the production table.";

export const PREFS_SAVE_ERROR =
  "Couldn’t save preferences. Try again in a minute. If it keeps failing, the notification table is still missing on production.";

export function isMissingNotificationSchema(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2021" || code === "P2022" || code === "P1010") return true;
  }
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /NotificationPreference|NotificationSend|does not exist in the current database|column .* does not exist|row.level security|RLS|permission denied|42501/i.test(
    msg
  );
}

async function addFkIfMissing(
  prisma: SchemaClient,
  conname: string,
  alterSql: string
) {
  const rows = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = ${conname}
  `;
  if (rows.length > 0) return;
  try {
    await prisma.$executeRawUnsafe(alterSql);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error ?? "");
    if (/already exists/i.test(msg)) return;
    throw error;
  }
}

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
  for (const col of PREF_COLUMNS) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.sql}`
    );
  }
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationPreference" DISABLE ROW LEVEL SECURITY
  `).catch(() => undefined);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key"
    ON "NotificationPreference" ("userId")
  `);
  await addFkIfMissing(
    prisma,
    "NotificationPreference_userId_fkey",
    `
      ALTER TABLE "NotificationPreference"
        ADD CONSTRAINT "NotificationPreference_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `
  );

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
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "id" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "userId" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT ''
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT NOT NULL DEFAULT ''
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "channel" TEXT NOT NULL DEFAULT 'email'
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "outcome" TEXT NOT NULL DEFAULT 'sent'
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend" DISABLE ROW LEVEL SECURITY
  `).catch(() => undefined);
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "NotificationSend_userId_type_dedupeKey_key"
    ON "NotificationSend" ("userId", "type", "dedupeKey")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "NotificationSend_userId_createdAt_idx"
    ON "NotificationSend" ("userId", "createdAt")
  `);
  await addFkIfMissing(
    prisma,
    "NotificationSend_userId_fkey",
    `
      ALTER TABLE "NotificationSend"
        ADD CONSTRAINT "NotificationSend_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `
  );
  console.log("[ensure-db] NotificationPreference + NotificationSend ready");
}
