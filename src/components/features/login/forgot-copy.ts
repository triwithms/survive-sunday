import type { OtpChannel } from "@/lib/otp";

export const FORGOT_INTRO =
  "We’ll email a 6-digit code, then you pick a new password. Check inbox and spam/junk — codes may be filtered.";

export function sentCodeCopy(channel: OtpChannel | undefined): string {
  if (channel === "sms") return "We texted a 6-digit code.";
  return "We emailed a 6-digit code. Check your inbox and spam/junk — codes may be filtered.";
}

export function otherChannelLabel(channel: OtpChannel): string {
  return channel === "sms"
    ? "Send to my phone instead"
    : "Send to email instead";
}
