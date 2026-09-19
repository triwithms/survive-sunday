import { isUserEmailUniqueError } from "./membership-schema";

export const EMAIL_ALREADY_USED = "That email is already used";
export const CELL_ALREADY_USED = "That cell is already used.";
export const NICKNAME_TAKEN = "That nickname is already taken in this pool";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isEmailTakenByOther(
  currentUserId: string,
  currentEmail: string,
  nextEmail: string,
  existing: { id: string } | null
): boolean {
  if (normalizeEmail(currentEmail) === nextEmail) return false;
  return Boolean(existing && existing.id !== currentUserId);
}

export function isCellTakenByOther(
  currentUserId: string,
  currentPhone: string | null,
  nextPhone: string | null,
  existing: { id: string } | null
): boolean {
  if (!nextPhone) return false;
  if (currentPhone === nextPhone) return false;
  return Boolean(existing && existing.id !== currentUserId);
}

export function uniqueContactFail(
  err: unknown
): { error: string; status: number } | null {
  if (isUserEmailUniqueError(err)) {
    return { error: EMAIL_ALREADY_USED, status: 409 };
  }
  const msg = err instanceof Error ? err.message : "";
  if (/Unique constraint|UNIQUE/.test(msg)) {
    return { error: NICKNAME_TAKEN, status: 409 };
  }
  return null;
}
