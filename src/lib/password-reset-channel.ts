import type { OtpChannel } from "./otp";

/** Email always. SMS too when a cell is on file — not a login-screen option. */
export function resetChannels(canSms: boolean): OtpChannel[] {
  return canSms ? ["email", "sms"] : ["email"];
}
