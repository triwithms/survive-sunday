/** Seatless sessions stay on Sign in. Never the public invite-code Join screen. */
export const SIGNED_IN_NO_POOL_PATH = "/login";

/**
 * Signed-in `/` and `/login` must not send a seatless session to Join.
 * That bounce is what traps ← Survive Sunday and "Already have a password?".
 */
export function entryPathAvoidingJoinTrap(next: string): string {
  const path = next.split("?")[0] ?? "";
  if (path === "/join") return "/login";
  return next;
}

/** Null means stay on Sign in. A pool seat still leaves for the app. */
export function signedInLoginRedirect(next: string): string | null {
  const entry = entryPathAvoidingJoinTrap(next);
  if (entry === "/login" || entry.startsWith("/login?")) return null;
  return entry;
}

/** `redirect()` throws. A try/catch must rethrow it or the bounce stays. */
export function isNextRedirect(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("digest" in error)) {
    return false;
  }
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

/** Logged-out invite links come back to Join after Sign in. Bare Join does not. */
export function loginReturnForInvite(args: {
  token?: string | null;
  seat?: string | null;
  who?: string | null;
  pool?: string | null;
}): string {
  const q = new URLSearchParams();
  const token = (args.token ?? "").trim();
  const seat = (args.seat ?? "").trim();
  const who = (args.who ?? "").trim();
  const pool = (args.pool ?? "").trim();
  if (token) q.set("t", token);
  if (seat) q.set("seat", seat);
  if (who) q.set("who", who);
  if (pool) q.set("pool", pool);
  const qs = q.toString();
  if (!qs) return "/login";
  return `/login?callbackUrl=${encodeURIComponent(`/join?${qs}`)}`;
}
