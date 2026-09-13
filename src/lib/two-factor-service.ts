import { prisma } from "./db";
import {
  TWO_FACTOR,
  generateGrantToken,
  generateOtpCode,
  hashSecret,
  isValidOtpShape,
  maskDestination,
  normalizeOtpInput,
  parseChannel,
  preferredChannel,
  secretsMatch,
  secondsUntil,
  expirySeconds,
  type TwoFactorChannel,
} from "./two-factor";
import { canRevealDevCode, deliverOtp } from "./two-factor-delivery";

export type TwoFactorSessionUser = {
  id: string;
  email?: string | null;
};

export type ChallengeStatus = {
  channel: TwoFactorChannel;
  destinationMasked: string;
  expiresInSec: number;
  resendAvailableInSec: number;
  canEmail: boolean;
  canSms: boolean;
  stubbed: boolean;
  devCode?: string;
};

type AppUser = {
  id: string;
  email: string;
  phoneE164: string | null;
};

function hourAgo(now = new Date()): Date {
  return new Date(now.getTime() - 60 * 60 * 1000);
}

export async function findAppUser(session: TwoFactorSessionUser): Promise<AppUser | null> {
  const byId = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, phoneE164: true },
  });
  if (byId) return byId;
  const email = session.email?.trim();
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, phoneE164: true },
  });
}

function identityWhere(session: TwoFactorSessionUser, appUser: AppUser | null) {
  const email = (appUser?.email || session.email || "").trim();
  const userId = appUser?.id;
  if (userId && email) {
    return { OR: [{ userId }, { email }] };
  }
  if (userId) return { userId };
  return { email };
}

export function availableChannels(appUser: AppUser | null, session: TwoFactorSessionUser) {
  const email = (appUser?.email || session.email || "").trim();
  const phone = appUser?.phoneE164 ?? null;
  return {
    email,
    phone,
    canEmail: Boolean(email),
    canSms: Boolean(phone),
  };
}

async function rateLimitSend(session: TwoFactorSessionUser, appUser: AppUser | null) {
  const where = identityWhere(session, appUser);
  const [sends, fails] = await Promise.all([
    prisma.twoFactorChallenge.count({
      where: { ...where, createdAt: { gte: hourAgo() } },
    }),
    prisma.twoFactorChallenge.aggregate({
      where: { ...where, createdAt: { gte: hourAgo() } },
      _sum: { attempts: true },
    }),
  ]);
  if (sends >= TWO_FACTOR.maxSendsPerHour) {
    return "Too many codes requested. Wait about an hour and try again.";
  }
  if ((fails._sum.attempts ?? 0) >= TWO_FACTOR.maxVerifyFailsPerHour) {
    return "Too many incorrect codes. Wait a bit, then request a new one.";
  }
  return null;
}

function statusFromChallenge(
  channel: TwoFactorChannel,
  destination: string,
  expiresAt: Date,
  lastSentAt: Date,
  extras: { stubbed: boolean; canEmail: boolean; canSms: boolean; devCode?: string }
): ChallengeStatus {
  return {
    channel,
    destinationMasked: maskDestination(channel, destination),
    expiresInSec: expirySeconds(expiresAt),
    resendAvailableInSec: secondsUntil(lastSentAt, TWO_FACTOR.resendCooldownMs),
    canEmail: extras.canEmail,
    canSms: extras.canSms,
    stubbed: extras.stubbed,
    ...(extras.devCode ? { devCode: extras.devCode } : {}),
  };
}

export async function sendTwoFactorCode(
  session: TwoFactorSessionUser,
  requested?: unknown
): Promise<{ ok: true; status: ChallengeStatus } | { ok: false; error: string; status?: ChallengeStatus }> {
  try {
    const appUser = await findAppUser(session);
    const channels = availableChannels(appUser, session);
    if (!channels.canEmail && !channels.canSms) {
      return { ok: false, error: "We don’t have an email or phone on file to send a code." };
    }

    const channel = preferredChannel(channels.canSms, parseChannel(requested));
    if (channel === "sms" && !channels.phone) {
      return { ok: false, error: "No cell number on file. We’ll need to email the code." };
    }
    if (channel === "email" && !channels.email) {
      return { ok: false, error: "No email on file." };
    }

    const destination = channel === "sms" ? channels.phone! : channels.email;
    const where = identityWhere(session, appUser);

    const existing = await prisma.twoFactorChallenge.findFirst({
      where: {
        ...where,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (
      existing &&
      existing.channel === channel &&
      secondsUntil(existing.lastSentAt, TWO_FACTOR.resendCooldownMs) > 0
    ) {
      return {
        ok: true,
        status: statusFromChallenge(channel, existing.destination, existing.expiresAt, existing.lastSentAt, {
          stubbed: false,
          canEmail: channels.canEmail,
          canSms: channels.canSms,
        }),
      };
    }

    const limited = await rateLimitSend(session, appUser);
    if (limited) {
      return {
        ok: false,
        error: limited,
        status: existing
          ? statusFromChallenge(
              existing.channel as TwoFactorChannel,
              existing.destination,
              existing.expiresAt,
              existing.lastSentAt,
              { stubbed: false, canEmail: channels.canEmail, canSms: channels.canSms }
            )
          : undefined,
      };
    }

    const code = generateOtpCode();
    const delivered = await deliverOtp(channel, destination, code);
    if (!delivered.ok) {
      if (channel === "sms" && channels.canEmail) {
        const fallback = await deliverOtp("email", channels.email, code);
        if (fallback.ok) {
          return persistChallenge(session, appUser, "email", channels.email, code, fallback.stubbed, channels);
        }
      }
      return { ok: false, error: delivered.error };
    }

    return persistChallenge(session, appUser, channel, destination, code, delivered.stubbed, channels);
  } catch (error) {
    console.error("[2fa] send failed", error);
    return { ok: false, error: "Could not send a code. Try again." };
  }
}

async function persistChallenge(
  session: TwoFactorSessionUser,
  appUser: AppUser | null,
  channel: TwoFactorChannel,
  destination: string,
  code: string,
  stubbed: boolean,
  channels: { canEmail: boolean; canSms: boolean }
): Promise<{ ok: true; status: ChallengeStatus }> {
  const now = new Date();
  const row = await prisma.twoFactorChallenge.create({
    data: {
      userId: appUser?.id ?? null,
      email: (appUser?.email || session.email || "").trim(),
      codeHash: hashSecret(code, "otp"),
      channel,
      destination,
      expiresAt: new Date(now.getTime() + TWO_FACTOR.expiryMs),
      lastSentAt: now,
    },
  });

  return {
    ok: true,
    status: statusFromChallenge(channel, destination, row.expiresAt, row.lastSentAt, {
      stubbed,
      canEmail: channels.canEmail,
      canSms: channels.canSms,
      devCode: canRevealDevCode() ? code : undefined,
    }),
  };
}

export async function verifyTwoFactorCode(
  session: TwoFactorSessionUser,
  rawCode: unknown
): Promise<{ ok: true; grant: string } | { ok: false; error: string; locked?: boolean }> {
  try {
    const code = normalizeOtpInput(typeof rawCode === "string" ? rawCode : "");
    if (!isValidOtpShape(code)) {
      return { ok: false, error: "Enter the 6-digit code." };
    }

    const appUser = await findAppUser(session);
    const where = identityWhere(session, appUser);
    const challenge = await prisma.twoFactorChallenge.findFirst({
      where: {
        ...where,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return { ok: false, error: "That code is wrong or expired. Request a new one." };
    }

    const updated = await prisma.twoFactorChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });

    if (updated.attempts > TWO_FACTOR.maxAttempts) {
      await prisma.twoFactorChallenge.update({
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
      const left = TWO_FACTOR.maxAttempts - updated.attempts;
      return {
        ok: false,
        error:
          left > 0
            ? `That code doesn’t match. ${left} ${left === 1 ? "try" : "tries"} left.`
            : "Too many tries on this code. Request a new one.",
        locked: left <= 0,
      };
    }

    const grant = generateGrantToken();
    await prisma.twoFactorChallenge.update({
      where: { id: challenge.id },
      data: {
        consumedAt: new Date(),
        grantHash: hashSecret(grant, "grant"),
        grantExpiresAt: new Date(Date.now() + TWO_FACTOR.grantTtlMs),
      },
    });

    return { ok: true, grant };
  } catch (error) {
    console.error("[2fa] verify failed", error);
    return { ok: false, error: "Could not check that code. Try again." };
  }
}

export type TwoFactorAuthorizedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  twoFactorComplete: true;
};

/**
 * Complete a verified 2FA grant. Must not throw — Auth.js maps authorize
 * exceptions as CallbackRouteError.
 */
export async function userFromTwoFactorGrant(
  grant: string
): Promise<TwoFactorAuthorizedUser | null> {
  try {
    const token = grant.trim();
    if (!token) return null;
    const grantHash = hashSecret(token, "grant");
    const challenge = await prisma.twoFactorChallenge.findFirst({
      where: {
        grantHash,
        consumedAt: { not: null },
        sessionAppliedAt: null,
        grantExpiresAt: { gt: new Date() },
      },
    });
    if (!challenge) return null;

    const applied = await prisma.twoFactorChallenge.updateMany({
      where: { id: challenge.id, sessionAppliedAt: null },
      data: { sessionAppliedAt: new Date() },
    });
    if (applied.count !== 1) return null;

    if (challenge.userId) {
      const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          twoFactorComplete: true,
        };
      }
    }

    if (challenge.email) {
      const user = await prisma.user.findUnique({ where: { email: challenge.email } });
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          twoFactorComplete: true,
        };
      }
    }

    return {
      id: challenge.userId || challenge.email,
      email: challenge.email,
      name: null,
      image: null,
      twoFactorComplete: true,
    };
  } catch (error) {
    console.error("[2fa] grant authorize failed", error);
    return null;
  }
}
