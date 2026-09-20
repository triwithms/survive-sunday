/** Shared email/password normalization for Sign in and Join claim. */

import bcrypt from "bcryptjs";
import { DEFAULT_SIGNED_IN_PATH } from "@/lib/app-paths";

export function normalizeAuthEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeAuthPassword(password: string): string {
  return password.normalize("NFC").trim();
}

/** Same check Sign in (authorize) and Join attach must use. */
export async function passwordsMatch(
  password: string,
  passwordHash: string
): Promise<boolean> {
  const candidate = normalizeAuthPassword(password);
  if (await bcrypt.compare(candidate, passwordHash)) return true;
  if (candidate !== password) {
    return bcrypt.compare(password, passwordHash);
  }
  return false;
}

export function safeAuthCallbackPath(
  raw: string | null | undefined,
  fallback = DEFAULT_SIGNED_IN_PATH
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}
