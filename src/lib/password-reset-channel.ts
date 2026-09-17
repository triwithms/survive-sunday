import type { OtpChannel } from "./otp";

/** Email is the default reset path. SMS only if the friend asks and a cell is saved. */
export function resetPreferredChannel(
  canSms: boolean,
  requested?: OtpChannel | null
): OtpChannel {
  if (requested === "sms" && canSms) return "sms";
  return "email";
}
