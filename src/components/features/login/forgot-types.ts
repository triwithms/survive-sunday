import type { OtpChannel } from "@/lib/otp";

export type ChallengeView = {
  channel: OtpChannel;
  destinationMasked: string;
  expiresInSec: number;
  resendAvailableInSec: number;
  canEmail: boolean;
  canSms: boolean;
  stubbed: boolean;
  devCode?: string;
};
