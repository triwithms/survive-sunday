import { CLAIM_PASSWORD_MIN } from "./claim-seat";
import { TEMP_PASSWORD_MAX } from "./check-set-member-password";
import { normalizeAuthEmail, normalizeAuthPassword } from "./auth-credentials";
import { MAX_NICKNAME } from "./roster-profile";
import { hmacHex, randomToken } from "./token-crypto";

const SALT = "pool-invite";

export function hashPoolInvite(token: string): string {
  return hmacHex(token.trim(), SALT);
}

export function mintPoolInviteSecret(): { token: string; tokenHash: string } {
  const token = randomToken(32);
  return { token, tokenHash: hashPoolInvite(token) };
}

export function poolInvitePath(token: string): string {
  return `/join/pool?t=${encodeURIComponent(token)}`;
}

export type ParsedPoolJoin = {
  token: string;
  email: string;
  password: string;
  nickname: string;
};

function fail(error: string, status = 400) {
  return { ok: false as const, status, error };
}

/** Email, password, and display name. Ignores any pool id in the body. */
export function parsePoolJoin(body: unknown) {
  if (!body || typeof body !== "object") return fail("Invalid JSON");
  const input = body as Record<string, unknown>;
  const token = typeof input.token === "string" ? input.token.trim() : "";
  const email = typeof input.email === "string" ? normalizeAuthEmail(input.email) : "";
  const password = typeof input.password === "string" ? input.password : "";
  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : "";
  if (!token) return fail("This join link is off or not valid.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail("Enter a valid email address.");
  }
  const normalized = normalizeAuthPassword(password);
  if (normalized.length < CLAIM_PASSWORD_MIN || password.length > TEMP_PASSWORD_MAX) {
    return fail(`Password must be ${CLAIM_PASSWORD_MIN}–${TEMP_PASSWORD_MAX} characters.`);
  }
  if (nickname.length < 1 || nickname.length > MAX_NICKNAME) {
    return fail(`Display name must be 1–${MAX_NICKNAME} characters.`);
  }
  if (nickname.toLowerCase() === "commissioner") {
    return fail("Pick a different display name.");
  }
  const value: ParsedPoolJoin = { token, email, password, nickname };
  return { ok: true as const, value };
}
