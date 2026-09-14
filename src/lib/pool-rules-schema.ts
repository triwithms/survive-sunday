/**
 * Additive columns for mulligan toggle + spectator→player after transfer.
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
};

export async function ensurePoolRulesColumns(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Pool" ADD COLUMN IF NOT EXISTS "singleEliminationFromWeek" INTEGER
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "isParticipant" BOOLEAN NOT NULL DEFAULT true
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "playingFromWeek" INTEGER
  `);
}
