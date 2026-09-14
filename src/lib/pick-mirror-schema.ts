/**
 * Additive Membership.mirrorFromMembershipId.
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRaw: <T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
};

export async function ensurePickMirrorColumn(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership"
      ADD COLUMN IF NOT EXISTS "mirrorFromMembershipId" TEXT
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Membership_mirrorFromMembershipId_idx"
    ON "Membership" ("mirrorFromMembershipId")
  `);
  const fk = await prisma.$queryRaw<Array<{ conname: string }>>`
    SELECT conname FROM pg_constraint
    WHERE conname = 'Membership_mirrorFromMembershipId_fkey'
  `;
  if (fk.length === 0) {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Membership"
        ADD CONSTRAINT "Membership_mirrorFromMembershipId_fkey"
        FOREIGN KEY ("mirrorFromMembershipId") REFERENCES "Membership"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership"
      ADD COLUMN IF NOT EXISTS "pickBackup" TEXT NOT NULL DEFAULT 'off'
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE "Membership"
    SET "pickBackup" = 'mirror'
    WHERE "mirrorFromMembershipId" IS NOT NULL
      AND ("pickBackup" IS NULL OR "pickBackup" = 'off')
  `);
  console.log("[ensure-db] Membership.mirrorFromMembershipId + pickBackup ready");
}
