import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const OTP = {
  codeLength: 6,
  expiryMs: 10 * 60 * 1000,
  maxAttempts: 5,
  resendCooldownMs: 45 * 1000,
  maxSendsPerHour: 8,
  maxVerifyFailsPerHour: 20,
  minPasswordLength: 6,
} as const;

export type OtpChannel = "email" | "sms";
export const OTP_PURPOSE_PASSWORD_RESET = "password_reset";

const DEMO_SUFFIX = "@survivesunday.demo";

export function isDemoEmail(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(DEMO_SUFFIX);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function preferredChannel(
  hasPhone: boolean,
  requested?: OtpChannel | null
): OtpChannel {
  if (requested === "sms" && hasPhone) return "sms";
  if (requested === "email") return "email";
  return hasPhone ? "sms" : "email";
}

export function parseChannel(value: unknown): OtpChannel | null {
  if (value === "email" || value === "sms") return value;
  return null;
}

export function generateOtpCode(length = OTP.codeLength): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}

function pepper(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-otp-pepper";
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
  return code.replace(/\D/g, "").slice(0, OTP.codeLength);
}

export function isValidOtpShape(code: string): boolean {
  return new RegExp(`^\\d{${OTP.codeLength}}$`).test(code);
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1) return "•••";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  return `${local.slice(0, 1)}•••@${domain}`;
}

export function maskPhone(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  if (last4.length < 4) return "•••";
  return `+1 •••-•••-${last4}`;
}

export function maskDestination(channel: OtpChannel, destination: string): string {
  return channel === "sms" ? maskPhone(destination) : maskEmail(destination);
}

export function secondsUntil(from: Date, cooldownMs: number, now = Date.now()): number {
  const remain = cooldownMs - (now - from.getTime());
  return remain > 0 ? Math.ceil(remain / 1000) : 0;
}

export function expirySeconds(expiresAt: Date, now = Date.now()): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000));
}
