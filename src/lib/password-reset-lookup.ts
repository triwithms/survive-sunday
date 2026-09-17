import { prisma } from "./db";
import { normalizeEmail } from "./otp";
import type { ResetUser } from "./password-reset-types";

const select = {
  id: true,
  email: true,
  passwordHash: true,
  phoneE164: true,
} as const;

/** Same casing fallback Sign in uses — claimed emails must reset. */
export async function lookupResetUser(
  emailRaw: string
): Promise<ResetUser | null> {
  const email = normalizeEmail(emailRaw);
  const byNormalized = await prisma.user.findUnique({
    where: { email },
    select,
  });
  if (byNormalized) return byNormalized;
  const raw = emailRaw.trim();
  if (raw && raw !== email) {
    return prisma.user.findUnique({ where: { email: raw }, select });
  }
  return null;
}
