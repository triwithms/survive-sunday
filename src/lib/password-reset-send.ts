import { prisma } from "./db";
import {
  OTP,
  OTP_PURPOSE_PASSWORD_RESET,
  secondsUntil,
  type OtpChannel,
} from "./otp";
import { createAndSendReset } from "./password-reset-create";
import { resetPreferredChannel } from "./password-reset-channel";
import {
  statusFrom,
  type ResetStatus,
  type ResetUser,
} from "./password-reset-types";

export async function sendResetCode(
  user: ResetUser,
  requested: OtpChannel | null
): Promise<
  | { ok: true; status: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  const canEmail = Boolean(user.email);
  const canSms = Boolean(user.phoneE164);
  const channel = resetPreferredChannel(canSms, requested);
  if (channel === "sms" && !user.phoneE164) {
    return {
      ok: false,
      error: "No cell number on file. We’ll need to email the code.",
    };
  }

  const destination = channel === "sms" ? user.phoneE164! : user.email;
  const purpose = OTP_PURPOSE_PASSWORD_RESET;
  const existing = await prisma.otpChallenge.findFirst({
    where: {
      userId: user.id,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  const createdMs = existing
    ? Date.now() - existing.createdAt.getTime()
    : Infinity;
  if (
    existing &&
    existing.channel === channel &&
    (secondsUntil(existing.lastSentAt, OTP.resendCooldownMs) > 0 ||
      createdMs < 5000)
  ) {
    return {
      ok: true,
      status: statusFrom(
        channel,
        existing.destination,
        existing.expiresAt,
        existing.lastSentAt,
        { stubbed: false, canEmail, canSms }
      ),
    };
  }

  return createAndSendReset(user, channel, destination, canEmail, canSms);
}
