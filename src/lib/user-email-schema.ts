/**
 * User.email may be NULL until an Administrator adds a login.
 * Preview + production share Neon — never drop leftover columns.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
};

export function isNotNullEmailError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /null value in column ["']email["']/i.test(msg);
}

export async function ensureUserEmailNullable(prisma: SchemaClient) {
  await prisma.$executeRawUnsafe(`
    UPDATE "User" SET "email" = NULL WHERE "email" = ''
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL
  `);
  console.log("[ensure-db] User.email is nullable");
}
