import bcrypt from "bcryptjs";
import { prisma } from "./db";
import {
  OTP,
  OTP_PURPOSE_PASSWORD_RESET,
  generateOtpCode,
  hashSecret,
  isDemoEmail,
  isValidOtpShape,
  maskDestination,
  normalizeEmail,
  normalizeOtpInput,
  parseChannel,
  preferredChannel,
  secretsMatch,
  secondsUntil,
  expirySeconds,
  type OtpChannel,
} from "./otp";
import { canRevealDevCode, deliverOtp } from "./otp-delivery";

export type ResetStatus = {
  channel: OtpChannel;
  destinationMasked: string;
  expiresInSec: number;
  resendAvailableInSec: number;
  canEmail: boolean;
  canSms: boolean;
  stubbed: boolean;
  devCode?: string;
};

const sendLocks = new Map<string, Promise<unknown>>();

async function withSendLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = sendLocks.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  sendLocks.set(
    key,
    prev.then(() => current)
  );
  await prev;
  try {
    return await fn();
  } finally {
    release();
    if (sendLocks.get(key) === current) sendLocks.delete(key);
  }
}

function hourAgo(): Date {
  return new Date(Date.now() - 60 * 60 * 1000);
}

function statusFrom(
  channel: OtpChannel,
  destination: string,
  expiresAt: Date,
  lastSentAt: Date,
  extras: { stubbed: boolean; canEmail: boolean; canSms: boolean; devCode?: string }
): ResetStatus {
  return {
    channel,
    destinationMasked: maskDestination(channel, destination),
    expiresInSec: expirySeconds(expiresAt),
    resendAvailableInSec: secondsUntil(lastSentAt, OTP.resendCooldownMs),
    canEmail: extras.canEmail,
    canSms: extras.canSms,
    stubbed: extras.stubbed,
    ...(extras.devCode ? { devCode: extras.devCode } : {}),
  };
}

export async function requestPasswordReset(
  emailRaw: string,
  requestedChannel?: unknown
): Promise<
  | { ok: true; demo?: boolean; message?: string; status?: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  try {
    const email = normalizeEmail(emailRaw);
    if (!email || !email.includes("@")) {
      return { ok: false, error: "Enter the email you use to sign in." };
    }

    if (isDemoEmail(email)) {
      return {
        ok: true,
        demo: true,
        message:
          "Demo seats always use password demo1234. Use the picker on the home page — no reset needed.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, phoneE164: true },
    });

    if (!user) {
      return {
        ok: false,
        error:
          "We don’t have that email. Check the spelling, or ask the commissioner.",
      };
    }

    if (!user.passwordHash) {
      return {
        ok: false,
        error:
          "This email does not have a password. Join with email and a password, or ask the commissioner.",
      };
    }

    return withSendLock(user.id, () => sendResetCode(user, parseChannel(requestedChannel)));
  } catch (error) {
    console.error("[password-reset] request failed", error);
    return { ok: false, error: "Could not send a code. Try again." };
  }
}

async function sendResetCode(
  user: { id: string; email: string; phoneE164: string | null },
  requested: OtpChannel | null
): Promise<
  | { ok: true; status: ResetStatus }
  | { ok: false; error: string; status?: ResetStatus }
> {
  const canEmail = Boolean(user.email);
  const canSms = Boolean(user.phoneE164);
  const channel = preferredChannel(canSms, requested);
  if (channel === "sms" && !user.phoneE164) {
    return { ok: false, error: "No cell number on file. We’ll need to email the code." };
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

  const createdMs = existing ? Date.now() - existing.createdAt.getTime() : Infinity;
  if (
    existing &&
    existing.channel === channel &&
    (secondsUntil(existing.lastSentAt, OTP.resendCooldownMs) > 0 || createdMs < 5000)
  ) {
    return {
      ok: true,
      status: statusFrom(channel, existing.destination, existing.expiresAt, existing.lastSentAt, {
        stubbed: false,
        canEmail,
        canSms,
      }),
    };
  }

  const sends = await prisma.otpChallenge.count({
    where: { userId: user.id, purpose, createdAt: { gte: hourAgo() } },
  });
  const fails = await prisma.otpChallenge.aggregate({
    where: { userId: user.id, purpose, createdAt: { gte: hourAgo() } },
    _sum: { attempts: true },
  });
  if (sends >= OTP.maxSendsPerHour) {
    return { ok: false, error: "Too many codes requested. Wait about an hour and try again." };
  }
  if ((fails._sum.attempts ?? 0) >= OTP.maxVerifyFailsPerHour) {
    return { ok: false, error: "Too many incorrect codes. Wait a bit, then try again." };
  }

  const code = generateOtpCode();
  let delivered = await deliverOtp(channel, destination, code);
  let usedChannel = channel;
  let usedDestination = destination;

  if (!delivered.ok && channel === "sms" && canEmail) {
    delivered = await deliverOtp("email", user.email, code);
    if (delivered.ok) {
      usedChannel = "email";
      usedDestination = user.email;
    }
  }
  if (!delivered.ok) {
    return { ok: false, error: delivered.error };
  }

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
    status: statusFrom(usedChannel, usedDestination, row.expiresAt, row.lastSentAt, {
      stubbed: delivered.stubbed,
      canEmail,
      canSms,
      devCode: canRevealDevCode() ? code : undefined,
    }),
  };
}

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
      return {
        ok: false,
        error: "Demo seats always use password demo1234.",
      };
    }
    if (!isValidOtpShape(code)) {
      return { ok: false, error: "Enter the 6-digit code." };
    }
    if (password.length < OTP.minPasswordLength) {
      return { ok: false, error: `New password must be at least ${OTP.minPasswordLength} characters.` };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
    if (!user?.passwordHash) {
      return { ok: false, error: "That code is wrong or expired. Request a new one." };
    }

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        userId: user.id,
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
      return {
        ok: false,
        error: "Too many tries on this code. Request a new one.",
        locked: true,
      };
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
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    return { ok: true };
  } catch (error) {
    console.error("[password-reset] reset failed", error);
    return { ok: false, error: "Could not update that password. Try again." };
  }
}
