/**
 * One login may hold the commissioner spectator seat and a player seat
 * in the same pool. `main` still has @@unique([poolId, userId]); preview
 * and production share Neon, so another deploy can put that unique back.
 * Drop it on every boot and before every attach — do not wait for a
 * one-off build helper.
 */

type SchemaClient = {
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: <T = unknown>(
    query: string,
    ...values: unknown[]
  ) => Promise<T>;
};

export const MEMBERSHIP_USER_UNIQUE = "Membership_poolId_userId_key";
export const MEMBERSHIP_USER_INDEX = "Membership_poolId_userId_idx";

export function isMembershipUserUniqueError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const meta =
    err && typeof err === "object" && "meta" in err
      ? (err as { meta?: { target?: unknown; modelName?: unknown } }).meta
      : undefined;
  const target = Array.isArray(meta?.target)
    ? meta.target.map(String).join(",")
    : typeof meta?.target === "string"
      ? meta.target
      : "";
  const model = typeof meta?.modelName === "string" ? meta.modelName : "";
  if (/User_email|emailTaken/i.test(msg) && !/Membership/i.test(msg)) {
    return false;
  }
  if (new RegExp(MEMBERSHIP_USER_UNIQUE, "i").test(msg)) return true;
  if (new RegExp(MEMBERSHIP_USER_UNIQUE, "i").test(target)) return true;
  if (
    model === "Membership" &&
    /poolId/i.test(target) &&
    /userId/i.test(target) &&
    !/nickname/i.test(target)
  ) {
    return true;
  }
  if (
    /unique/i.test(msg) &&
    /poolId/i.test(msg) &&
    /userId/i.test(msg) &&
    !/nickname/i.test(msg) &&
    !/User_email/i.test(msg)
  ) {
    return true;
  }
  return false;
}

export function isUserEmailUniqueError(err: unknown): boolean {
  if (isMembershipUserUniqueError(err)) return false;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const meta =
    err && typeof err === "object" && "meta" in err
      ? (err as { meta?: { target?: unknown } }).meta
      : undefined;
  const target = Array.isArray(meta?.target)
    ? meta.target.map(String).join(",")
    : typeof meta?.target === "string"
      ? meta.target
      : "";
  return /User_email/i.test(msg) || /User_email/i.test(target);
}

export async function membershipUserUniqueExists(
  db: SchemaClient
): Promise<boolean> {
  const rows = await db.$queryRawUnsafe<Array<{ present: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = $1
      UNION ALL
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = $1
    ) AS present`,
    MEMBERSHIP_USER_UNIQUE
  );
  return Boolean(rows[0]?.present);
}

export async function ensureDualMembershipIndex(db: SchemaClient): Promise<{
  droppedUnique: boolean;
}> {
  let before = false;
  try {
    before = await membershipUserUniqueExists(db);
  } catch {
    before = false;
  }
  await db.$executeRawUnsafe(
    `ALTER TABLE "Membership" DROP CONSTRAINT IF EXISTS "${MEMBERSHIP_USER_UNIQUE}"`
  );
  await db.$executeRawUnsafe(
    `DROP INDEX IF EXISTS "${MEMBERSHIP_USER_UNIQUE}"`
  );
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "${MEMBERSHIP_USER_INDEX}" ON "Membership" ("poolId", "userId")`
  );
  return { droppedUnique: before };
}
