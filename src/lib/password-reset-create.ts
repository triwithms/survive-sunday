import { prisma } from "./db";
import {
  OTP,
  OTP_PURPOSE_PASSWORD_RESET,
  generateOtpCode,
  hashSecret,
} from "./otp";
import { canRevealDevCode } from "./otp-delivery";
import { notifyAdminsOfResetRequest } from "./password-reset-alert";
import { deliverResetCode } from "./password-reset-deliver";
import {
  statusFrom,
  type ResetStatus,
  type ResetUser,
} from "./password-reset-types";

function hourAgo(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

export async function createAndSendReset(
  user: ResetUser
): Promise<
  | { ok: true; status: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  const purpose = OTP_PURPOSE_PASSWORD_RESET;
  const canEmail = Boolean(user.email);
  const sends = await prisma.otpChallenge.count({
    where: { userId: user.id, purpose, createdAt: { gte: hourAgo() } },
  });
  const fails = await prisma.otpChallenge.aggregate({
    where: { userId: user.id, purpose, createdAt: { gte: hourAgo() } },
    _sum: { attempts: true },
  });
  if (sends >= OTP.maxSendsPerHour) {
    return {
      ok: false,
      error: "Too many codes requested. Wait about an hour and try again.",
    };
  }
  if ((fails._sum.attempts ?? 0) >= OTP.maxVerifyFailsPerHour) {
    return {
      ok: false,
      error: "Too many incorrect codes. Wait a bit, then try again.",
    };
  }

  const code = generateOtpCode();
  const delivered = await deliverResetCode(user, code);
  if (!delivered.ok) return { ok: false, error: delivered.error };

  await prisma.otpChallenge.updateMany({
    where: { userId: user.id, purpose, consumedAt: null },
    data: { expiresAt: new Date() },
  });
  const now = new Date();
  const row = await prisma.otpChallenge.create({
    data: {
      userId: user.id,
      email: user.email,
      purpose,
      codeHash: hashSecret(code, "otp"),
      channel: "email",
      destination: user.email,
      expiresAt: new Date(now.getTime() + OTP.expiryMs),
      lastSentAt: now,
    },
  });
  notifyAdminsOfResetRequest(user.id, user.email);
  return {
    ok: true,
    status: statusFrom("email", user.email, row.expiresAt, row.lastSentAt, {
      stubbed: delivered.stubbed,
      canEmail,
      canSms: delivered.smsSent,
      devCode: canRevealDevCode() ? code : undefined,
    }),
  };
}
