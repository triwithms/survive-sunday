import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  OTP,
  OTP_PURPOSE_PASSWORD_RESET,
  isDemoEmail,
  isValidOtpShape,
  normalizeEmail,
  normalizeOtpInput,
  secretsMatch,
} from "./otp";
import { lookupResetUser } from "./password-reset-lookup";

export async function resetPasswordWithCode(
  emailRaw: string,
  rawCode: unknown,
  rawPassword: unknown
): Promise<{ ok: true } | { ok: false; error: string; locked?: boolean }> {
  try {
    const email = normalizeEmail(emailRaw);
    const code = normalizeOtpInput(typeof rawCode === "string" ? rawCode : "");
    const password = typeof rawPassword === "string" ? rawPassword : "";
    if (isDemoEmail(email)) {
      return { ok: false, error: "Demo seats always use password demo1234." };
    }
    if (!isValidOtpShape(code)) {
      return { ok: false, error: "Enter the 6-digit code." };
    }
    if (password.length < OTP.minPasswordLength) {
      return {
        ok: false,
        error: `New password must be at least ${OTP.minPasswordLength} characters.`,
      };
    }
    const user = await lookupResetUser(emailRaw);
    if (!user) {
      return { ok: false, error: "That code is wrong or expired. Request a new one." };
    }
    return consumeResetCode(user.id, code, password);
  } catch (error) {
    console.error("[password-reset] reset failed", error);
    return { ok: false, error: "Could not update that password. Try again." };
  }
}

async function consumeResetCode(
  userId: string,
  code: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string; locked?: boolean }> {
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      userId,
      purpose: OTP_PURPOSE_PASSWORD_RESET,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!challenge) {
    return { ok: false, error: "That code is wrong or expired. Request a new one." };
  }
  const updated = await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });
  if (updated.attempts > OTP.maxAttempts) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { expiresAt: new Date() },
    });
    return { ok: false, error: "Too many tries on this code. Request a new one.", locked: true };
  }
  if (!secretsMatch(code, "otp", challenge.codeHash)) {
    const left = OTP.maxAttempts - updated.attempts;
    return {
      ok: false,
      error:
        left > 0
          ? `That code doesn’t match. ${left} ${left === 1 ? "try" : "tries"} left.`
          : "Too many tries on this code. Request a new one.",
      locked: left <= 0,
    };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    }),
  ]);
  return { ok: true };
}
