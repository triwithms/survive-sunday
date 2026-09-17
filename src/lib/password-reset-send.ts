import { prisma } from "./db";
import { OTP, OTP_PURPOSE_PASSWORD_RESET, secondsUntil } from "./otp";
import { createAndSendReset } from "./password-reset-create";
import {
  statusFrom,
  type ResetStatus,
  type ResetUser,
} from "./password-reset-types";

export async function sendResetCode(
  user: ResetUser
): Promise<
  | { ok: true; status: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  const canEmail = Boolean(user.email);
  const canSms = Boolean(user.phoneE164);
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
    (secondsUntil(existing.lastSentAt, OTP.resendCooldownMs) > 0 ||
      createdMs < 5000)
  ) {
    return {
      ok: true,
      status: statusFrom(
        "email",
        existing.destination,
        existing.expiresAt,
        existing.lastSentAt,
        { stubbed: false, canEmail, canSms }
      ),
    };
  }

  return createAndSendReset(user);
}
