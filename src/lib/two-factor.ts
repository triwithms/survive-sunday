import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";

export const TWO_FACTOR = {
  codeLength: 6,
  expiryMs: 10 * 60 * 1000,
  maxAttempts: 5,
  resendCooldownMs: 45 * 1000,
  maxSendsPerHour: 8,
  maxVerifyFailsPerHour: 20,
  grantTtlMs: 5 * 60 * 1000,
} as const;

export type TwoFactorChannel = "email" | "sms";

const DEMO_SUFFIX = "@survivesunday.demo";

export function isDemoEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(DEMO_SUFFIX);
}

/** Default on. Set TWO_FACTOR_ENABLED=false to turn the extra step off. */
export function isTwoFactorEnabled(): boolean {
  const raw = process.env.TWO_FACTOR_ENABLED;
  if (raw == null || raw === "") return true;
  const normalized = raw.trim().toLowerCase();
  return normalized !== "false" && normalized !== "0" && normalized !== "off";
}

export function requiresTwoFactor(email?: string | null): boolean {
  if (!isTwoFactorEnabled()) return false;
  if (isDemoEmail(email)) return false;
  return true;
}

export function preferredChannel(
  hasPhone: boolean,
  requested?: TwoFactorChannel | null
): TwoFactorChannel {
  if (requested === "sms" && hasPhone) return "sms";
  if (requested === "email") return "email";
  return hasPhone ? "sms" : "email";
}

export function parseChannel(value: unknown): TwoFactorChannel | null {
  if (value === "email" || value === "sms") return value;
  return null;
}

export function generateOtpCode(length = TWO_FACTOR.codeLength): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}

export function generateGrantToken(): string {
  return randomBytes(32).toString("hex");
}

function pepper(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-2fa-pepper";
}

export function hashSecret(value: string, salt: string): string {
  return createHmac("sha256", pepper()).update(`${salt}:${value}`).digest("hex");
}

export function secretsMatch(value: string, salt: string, expectedHash: string): boolean {
  if (!expectedHash) return false;
  const actual = hashSecret(value, salt);
  const a = Buffer.from(actual);
  const b = Buffer.from(expectedHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function normalizeOtpInput(code: string): string {
  return code.replace(/\D/g, "").slice(0, TWO_FACTOR.codeLength);
}

export function isValidOtpShape(code: string): boolean {
  return new RegExp(`^\\d{${TWO_FACTOR.codeLength}}$`).test(code);
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1) return "•••";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const keep = local.slice(0, 1);
  return `${keep}•••@${domain}`;
}

export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  if (last4.length < 4) return "•••";
  return `+1 •••-•••-${last4}`;
}

export function maskDestination(channel: TwoFactorChannel, destination: string): string {
  return channel === "sms" ? maskPhone(destination) : maskEmail(destination);
}

export function secondsUntil(from: Date, cooldownMs: number, now = Date.now()): number {
  const elapsed = now - from.getTime();
  const remain = cooldownMs - elapsed;
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

export function expirySeconds(expiresAt: Date, now = Date.now()): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000));
}
