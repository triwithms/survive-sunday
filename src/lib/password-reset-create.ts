import { prisma } from "./db";
import {
  OTP,
  OTP_PURPOSE_PASSWORD_RESET,
  generateOtpCode,
  hashSecret,
  type OtpChannel,
} from "./otp";
import { canRevealDevCode, deliverOtp } from "./otp-delivery";
import {
  statusFrom,
  type ResetStatus,
  type ResetUser,
} from "./password-reset-types";

function hourAgo(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

export async function createAndSendReset(
  user: ResetUser,
  channel: OtpChannel,
  destination: string,
  canEmail: boolean,
  canSms: boolean
): Promise<
  | { ok: true; status: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  const purpose = OTP_PURPOSE_PASSWORD_RESET;
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
  let delivered = await deliverOtp(channel, destination, code, purpose);
  let usedChannel = channel;
  let usedDestination = destination;
  if (!delivered.ok && channel === "sms" && canEmail) {
    delivered = await deliverOtp("email", user.email, code, purpose);
    if (delivered.ok) {
      usedChannel = "email";
      usedDestination = user.email;
    }
  }
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
      channel: usedChannel,
      destination: usedDestination,
      expiresAt: new Date(now.getTime() + OTP.expiryMs),
      lastSentAt: now,
    },
  });
  return {
    ok: true,
    status: statusFrom(
      usedChannel,
      usedDestination,
      row.expiresAt,
      row.lastSentAt,
      {
        stubbed: delivered.stubbed,
        canEmail,
        canSms,
        devCode: canRevealDevCode() ? code : undefined,
      }
    ),
  };
}
