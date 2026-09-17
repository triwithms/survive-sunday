/**
 * Additive InviteToken table (hash + expiry, never plaintext).
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

export function isMissingInviteTokenSchema(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2021" || code === "P2022") return true;
  }
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /InviteToken|does not exist in the current database/i.test(msg);
}

export async function ensureInviteTokenTable(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InviteToken" (
      "id" TEXT NOT NULL,
      "tokenHash" TEXT NOT NULL,
      "membershipId" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "consumedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "InviteToken_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "InviteToken" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "InviteToken" ADD COLUMN IF NOT EXISTS "membershipId" TEXT`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "InviteToken" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "InviteToken" ADD COLUMN IF NOT EXISTS "consumedAt" TIMESTAMP(3)`
  );
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "InviteToken_tokenHash_key"
    ON "InviteToken" ("tokenHash")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "InviteToken_membershipId_idx"
    ON "InviteToken" ("membershipId")
  `);
  const fk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint WHERE conname = 'InviteToken_membershipId_fkey'
  `;
  if (fk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "InviteToken"
        ADD CONSTRAINT "InviteToken_membershipId_fkey"
        FOREIGN KEY ("membershipId") REFERENCES "Membership"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  }
  console.log("[ensure-db] InviteToken table ready");
}
