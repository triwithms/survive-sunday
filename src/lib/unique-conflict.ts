/** Prisma P2002, including the message Prisma prints before throwing. */
export function isUniqueConflict(error: unknown): boolean {
  if (error && typeof error === "object" && "code" in error) {
    if ((error as { code?: unknown }).code === "P2002") return true;
  }
  const msg = error instanceof Error ? error.message : String(error ?? "");
  return /Unique constraint failed/i.test(msg);
}

/**
 * `createMany({ skipDuplicates: true })` count.
 * 1 = this request inserted the row. 0 = another request already did.
 */
export function claimedFreshRow(count: number): boolean {
  return count > 0;
}
