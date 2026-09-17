import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/** HMAC key: Auth.js AUTH_SECRET (no second token secret). */
export function authPepper(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret?.trim()) {
    throw new Error("AUTH_SECRET is required for token HMAC");
  }
  return secret;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hmacHex(value: string, salt: string): string {
  return createHmac("sha256", authPepper())
    .update(`${salt}:${value}`)
    .digest("hex");
}

export function hmacMatch(value: string, salt: string, expected: string): boolean {
  if (!expected) return false;
  const actual = hmacHex(value, salt);
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function hmacSign(payload: string): string {
  return createHmac("sha256", authPepper()).update(payload).digest("base64url");
}

export function hmacSignMatch(payload: string, signature: string): boolean {
  if (!signature) return false;
  const expected = hmacSign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function expiresAt(ttlMs: number, now = Date.now()): Date {
  return new Date(now + ttlMs);
}

export function isExpired(expires: Date, now = Date.now()): boolean {
  return expires.getTime() <= now;
}

export function timingSafeString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
