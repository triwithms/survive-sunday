/**
 * Additive WeekWrapSetting. Preview + production share Neon.
 * Never drop columns. Never run from the Vercel build.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

export async function ensureWeekWrapTable(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "WeekWrapSetting" (
      "poolId" TEXT NOT NULL,
      "tone" TEXT NOT NULL DEFAULT 'facts',
      "showRoster" BOOLEAN NOT NULL DEFAULT true,
      "showPicks" BOOLEAN NOT NULL DEFAULT true,
      "showBoardLink" BOOLEAN NOT NULL DEFAULT true,
      "showDrama" BOOLEAN NOT NULL DEFAULT true,
      "emailOverride" TEXT NOT NULL DEFAULT '',
      "smsOverride" TEXT NOT NULL DEFAULT '',
      "skippedWeeksJson" TEXT NOT NULL DEFAULT '[]',
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WeekWrapSetting_pkey" PRIMARY KEY ("poolId")
    )
  `);
  const columns: Array<[string, string]> = [
    ["poolId", `TEXT`],
    ["tone", `TEXT NOT NULL DEFAULT 'facts'`],
    ["showRoster", `BOOLEAN NOT NULL DEFAULT true`],
    ["showPicks", `BOOLEAN NOT NULL DEFAULT true`],
    ["showBoardLink", `BOOLEAN NOT NULL DEFAULT true`],
    ["showDrama", `BOOLEAN NOT NULL DEFAULT true`],
    ["emailOverride", `TEXT NOT NULL DEFAULT ''`],
    ["smsOverride", `TEXT NOT NULL DEFAULT ''`],
    ["skippedWeeksJson", `TEXT NOT NULL DEFAULT '[]'`],
    ["updatedAt", `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`],
  ];
  for (const [name, sql] of columns) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "WeekWrapSetting" ADD COLUMN IF NOT EXISTS "${name}" ${sql}`
    );
  }
  await prisma
    .$executeRawUnsafe(`ALTER TABLE "WeekWrapSetting" DISABLE ROW LEVEL SECURITY`)
    .catch(() => undefined);
  const fk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'WeekWrapSetting_poolId_fkey'
  `;
  if (fk.length === 0) {
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "WeekWrapSetting"
          ADD CONSTRAINT "WeekWrapSetting_poolId_fkey"
          FOREIGN KEY ("poolId") REFERENCES "Pool"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error ?? "");
      if (!/already exists/i.test(msg)) throw error;
    }
  }
  console.log("[ensure-db] WeekWrapSetting ready");
}
