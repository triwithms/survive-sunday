/**
 * Additive ServerError table. Preview + production share Neon.
 * Never drop columns. Never run from the Vercel build.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string) => Promise<unknown>;
};

const COLUMNS: Array<[string, string]> = [
  ["id", `TEXT`],
  ["createdAt", `TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`],
  ["route", `TEXT NOT NULL DEFAULT ''`],
  ["message", `TEXT NOT NULL DEFAULT ''`],
  ["digest", `TEXT`],
  ["source", `TEXT NOT NULL DEFAULT 'request'`],
];

export async function ensureServerErrorTable(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ServerError" (
      "id" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "route" TEXT NOT NULL DEFAULT '',
      "message" TEXT NOT NULL DEFAULT '',
      "digest" TEXT,
      "source" TEXT NOT NULL DEFAULT 'request',
      CONSTRAINT "ServerError_pkey" PRIMARY KEY ("id")
    )
  `);
  for (const [name, sql] of COLUMNS) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "ServerError" ADD COLUMN IF NOT EXISTS "${name}" ${sql}`
    );
  }
  await prisma
    .$executeRawUnsafe(`ALTER TABLE "ServerError" DISABLE ROW LEVEL SECURITY`)
    .catch(() => undefined);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "ServerError_createdAt_idx"
    ON "ServerError" ("createdAt")
  `);
}
