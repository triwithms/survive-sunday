import {
  OTP_PURPOSE_PASSWORD_RESET,
  OTP_PURPOSE_SIGN_IN,
  type OtpChannel,
} from "./otp";
import {
  canStubDelivery,
  emailProviderReady,
  sendResendMessage,
  sendTwilioMessage,
  smsProviderReady,
  type DeliverResult,
} from "./delivery";

export type { DeliverResult };
export { canStubDelivery, emailProviderReady, smsProviderReady };

export function canRevealDevCode(): boolean {
  return process.env.NODE_ENV !== "production";
}

export type OtpCopyKind = "password_reset" | "sign_in";

export function otpCopyKind(purpose: string): OtpCopyKind {
  return purpose === OTP_PURPOSE_SIGN_IN ? "sign_in" : "password_reset";
}

export function otpSmsBody(code: string, kind: OtpCopyKind = "password_reset"): string {
  const label =
    kind === "sign_in" ? "sign-in code" : "password-reset code";
  return `${code} is your Survive Sunday ${label}. It expires in 10 minutes.`;
}

export function otpEmailSubject(kind: OtpCopyKind = "password_reset"): string {
  return kind === "sign_in"
    ? "Your Survive Sunday sign-in code"
    : "Your Survive Sunday password-reset code";
}

export async function deliverOtp(
  channel: OtpChannel,
  destination: string,
  code: string,
  purpose: string = OTP_PURPOSE_PASSWORD_RESET
): Promise<DeliverResult> {
  const kind = otpCopyKind(purpose);
  if (channel === "sms") {
    return sendTwilioMessage({
      to: destination,
      body: otpSmsBody(code, kind),
    });
  }

  return sendResendMessage({
    to: destination,
    subject: otpEmailSubject(kind),
    text: emailText(code, kind),
    html: emailHtml(code, kind),
  });
}

export function emailText(code: string, kind: OtpCopyKind): string {
  const noun = kind === "sign_in" ? "sign-in code" : "password-reset code";
  const ignore =
    kind === "sign_in"
      ? "If you did not ask to sign in, you can ignore this email."
      : "If you did not ask to reset your password, you can ignore this email.";
  return [
    `Your Survive Sunday ${noun} is ${code}.`,
    "",
    "It expires in 10 minutes.",
    "If you do not see this, check spam/junk — codes may be filtered.",
    ignore,
  ].join("\n");
}

export function emailHtml(code: string, kind: OtpCopyKind): string {
  const heading =
    kind === "sign_in" ? "Your sign-in code is:" : "Your password-reset code is:";
  const ignore =
    kind === "sign_in"
      ? "It expires in 10 minutes. If you did not ask to sign in, ignore this email."
      : "It expires in 10 minutes. If you did not ask to reset your password, ignore this email.";
  return `<!doctype html>
<html>
  <body style="background:#0b0e12;color:#f2f4f7;font-family:Georgia,serif;padding:24px;">
    <p style="color:#e8c547;font-size:20px;letter-spacing:0.08em;margin:0 0 16px;">SURVIVE SUNDAY</p>
    <p style="margin:0 0 12px;">${heading}</p>
    <p style="font-size:32px;letter-spacing:0.28em;margin:0 0 16px;font-family:ui-monospace,monospace;">${code}</p>
    <p style="color:#9aa5b5;font-size:14px;margin:0 0 8px;">If you do not see this in your inbox, check spam/junk — codes may be filtered.</p>
    <p style="color:#9aa5b5;font-size:14px;margin:0;">${ignore}</p>
  </body>
</html>`;
}
