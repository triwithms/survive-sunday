import { prisma } from "./db";
import { INVITE_CODE } from "./constants";
import { isDemoEmail, isLiveMode } from "./pool-mode";
import {
  OTP,
  OTP_PURPOSE_SIGN_IN,
  generateOtpCode,
  hashSecret,
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
import type { AuthorizedUser } from "./credentials-user";

export type SignInCodeStatus = {
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
): SignInCodeStatus {
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

async function liveModeBlocksPracticeEmail(
  email: string,
  userId: string
): Promise<boolean> {
  if (!isDemoEmail(email)) return false;
  const pool = await prisma.pool.findUnique({
    where: { inviteCode: INVITE_CODE },
    select: { id: true, mode: true },
  });
  if (!isLiveMode(pool?.mode) || !pool) return false;
  const admins = await prisma.membership.findMany({
    where: { poolId: pool.id, role: "admin" },
    select: { userId: true, user: { select: { email: true } } },
  });
  const hasRealCommissioner = admins.some((a) => !isDemoEmail(a.user.email));
  const isPracticeAdmin = admins.some((a) => a.userId === userId);
  return hasRealCommissioner || !isPracticeAdmin;
}

export async function requestSignInCode(
  emailRaw: string,
  requestedChannel?: unknown
): Promise<
  | { ok: true; demo?: boolean; message?: string; status?: SignInCodeStatus }
  | { ok: false; error: string; status?: SignInCodeStatus }
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
          "Demo seats always use password demo1234. Use the picker on the home page — no code needed.",
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
          "We don’t have that email. Check the spelling, or Join first (don’t use a code before you Join).",
      };
    }

    if (!user.passwordHash) {
      return {
        ok: false,
        error:
          "This email does not have a password. Join with email and a password, or ask the commissioner.",
      };
    }

    if (await liveModeBlocksPracticeEmail(email, user.id)) {
      return {
        ok: false,
        error:
          "That practice login does not work in the real pool. Join with your own email, or Sign in with it.",
      };
    }

    return withSendLock(user.id, () =>
      sendSignInCode(user, parseChannel(requestedChannel))
    );
  } catch (error) {
    console.error("[signin-otp] request failed", error);
    return { ok: false, error: "Could not send a code. Try again." };
  }
}

async function sendSignInCode(
  user: { id: string; email: string; phoneE164: string | null },
  requested: OtpChannel | null
): Promise<
  | { ok: true; status: SignInCodeStatus }
  | { ok: false; error: string; status?: SignInCodeStatus }
> {
  const canEmail = Boolean(user.email);
  const canSms = Boolean(user.phoneE164);
  const channel = preferredChannel(canSms, requested);
  if (channel === "sms" && !user.phoneE164) {
    return { ok: false, error: "No cell number on file. We’ll email the code instead." };
  }

  const destination = channel === "sms" ? user.phoneE164! : user.email;
  const purpose = OTP_PURPOSE_SIGN_IN;

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

/**
 * Consume a sign-in code and return the user. Must not throw — Auth.js
 * maps authorize exceptions to CallbackRouteError.
 */
export async function userFromSignInOtp(
  emailRaw: string,
  rawCode: unknown
): Promise<AuthorizedUser | null> {
  try {
    const email = normalizeEmail(emailRaw);
    const code = normalizeOtpInput(typeof rawCode === "string" ? rawCode : "");
    if (!email || !isValidOtpShape(code)) return null;
    if (isDemoEmail(email)) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        passwordHash: true,
      },
    });
    if (!user?.passwordHash) return null;
    if (await liveModeBlocksPracticeEmail(email, user.id)) return null;

    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        userId: user.id,
        purpose: OTP_PURPOSE_SIGN_IN,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) return null;

    const updated = await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts > OTP.maxAttempts) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { expiresAt: new Date() },
      });
      return null;
    }

    if (!secretsMatch(code, "otp", challenge.codeHash)) {
      return null;
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    };
  } catch (error) {
    console.error("[signin-otp] verify failed", error);
    return null;
  }
}
