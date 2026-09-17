import {
  OTP,
  expirySeconds,
  maskDestination,
  secondsUntil,
  type OtpChannel,
} from "./otp";

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

export type ResetUser = {
  id: string;
  email: string;
  passwordHash: string | null;
  phoneE164: string | null;
};

export function statusFrom(
  channel: OtpChannel,
  destination: string,
  expiresAt: Date,
  lastSentAt: Date,
  extras: {
    stubbed: boolean;
    canEmail: boolean;
    canSms: boolean;
    devCode?: string;
  }
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
