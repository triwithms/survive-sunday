/**
 * Additive User.notifyPref + NotificationSend.outcome.
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

export type NotifyPrefDefaultCounts = {
  email: number;
  nonePhone: number;
  noneNeither: number;
  alreadySet: number;
};

export async function ensureUserNotifyPref(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "notifyPref" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "NotificationSend"
      ADD COLUMN IF NOT EXISTS "outcome" TEXT NOT NULL DEFAULT 'sent'
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NotifyPrefBackfill" (
      "id" TEXT NOT NULL,
      "doneAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "NotifyPrefBackfill_pkey" PRIMARY KEY ("id")
    )
  `);
  const counts = await backfillNotifyPrefDefaults(prisma);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "notifyPref" SET DEFAULT 'none'
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "notifyPref" SET NOT NULL
  `).catch(() => undefined);
  console.log(
    `[ensure-db] User.notifyPref ready defaults email=${counts.email} none_phone=${counts.nonePhone} none_neither=${counts.noneNeither} already=${counts.alreadySet}`
  );
  return counts;
}

export async function backfillNotifyPrefDefaults(
  prisma: SchemaClient
): Promise<NotifyPrefDefaultCounts> {
  const marker = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "NotifyPrefBackfill" WHERE "id" = 'v1'
  `;
  const ran = marker.length > 0;
  const where = ran
    ? `("notifyPref" IS NULL OR "notifyPref" = '')`
    : `("notifyPref" IS NULL OR "notifyPref" = '' OR "notifyPref" = 'none')`;
  const email = await prisma.$executeRawUnsafe(`
    UPDATE "User" SET "notifyPref" = 'email'
    WHERE ${where} AND "email" IS NOT NULL AND TRIM("email") <> ''
  `);
  const phone = await prisma.$executeRawUnsafe(`
    UPDATE "User" SET "notifyPref" = 'none'
    WHERE ${where}
      AND ("email" IS NULL OR TRIM("email") = '')
      AND "phoneE164" IS NOT NULL AND TRIM("phoneE164") <> ''
  `);
  const neither = await prisma.$executeRawUnsafe(`
    UPDATE "User" SET "notifyPref" = 'none'
    WHERE "notifyPref" IS NULL OR "notifyPref" = ''
  `);
  if (!ran) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "NotifyPrefBackfill" ("id", "doneAt")
      VALUES ('v1', CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING
    `);
  }
  const set = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT COUNT(*) FILTER (WHERE "notifyPref" IN ('email','sms','both'))::int AS n FROM "User"
  `;
  return {
    email: Number(email) || 0,
    nonePhone: Number(phone) || 0,
    noneNeither: Number(neither) || 0,
    alreadySet: set[0]?.n ?? 0,
  };
}
