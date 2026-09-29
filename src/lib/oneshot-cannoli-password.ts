import type { PrismaClient } from "@prisma/client";

/**
 * Retired. A one-time temporary password used to live in this file.
 * It is not stored here anymore. Later deploys must not set a password.
 * Use Admin → Set a temporary password instead.
 */
export const CANNOLI_ONESHOT_AUDIT = "oneshot_cannoli_temp_password_20260914";
export const CANNOLI_NICKNAME = "Cannoli Stuffer";

export type CannoliOneshotResult =
  | { status: "applied"; email: string; userId: string; membershipId: string }
  | { status: "already" }
  | { status: "skipped"; reason: string };

/** No-op. Does not read or write passwords. */
export async function applyCannoliTempPasswordOneshot(
  _db: PrismaClient
): Promise<CannoliOneshotResult> {
  return { status: "skipped", reason: "retired" };
}
