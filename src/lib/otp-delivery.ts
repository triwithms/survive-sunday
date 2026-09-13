import type { OtpChannel } from "./otp";
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

export async function deliverOtp(
  channel: OtpChannel,
  destination: string,
  code: string
): Promise<DeliverResult> {
  if (channel === "sms") {
    if (smsProviderReady() || canStubDelivery()) {
      return sendTwilioMessage({
        to: destination,
        body: `${code} is your Survive Sunday password-reset code. It expires in 10 minutes.`,
      });
    }
    return {
      ok: false,
      error: "Text messages aren’t set up yet. Ask for an email code instead.",
    };
  }

  if (emailProviderReady() || canStubDelivery()) {
    return sendResendMessage({
      to: destination,
      subject: "Your Survive Sunday password-reset code",
      text: emailText(code),
      html: emailHtml(code),
    });
  }
  return {
    ok: false,
    error:
      "We couldn’t email a code. The commissioner still needs to add the Resend key (see DEPLOY.md).",
  };
}

function emailText(code: string): string {
  return [
    `Your Survive Sunday password-reset code is ${code}.`,
    "",
    "It expires in 10 minutes.",
    "If you did not ask to reset your password, you can ignore this email.",
  ].join("\n");
}

function emailHtml(code: string): string {
  return `<!doctype html>
<html>
  <body style="background:#0b0e12;color:#f2f4f7;font-family:Georgia,serif;padding:24px;">
    <p style="color:#e8c547;font-size:20px;letter-spacing:0.08em;margin:0 0 16px;">SURVIVE SUNDAY</p>
    <p style="margin:0 0 12px;">Your password-reset code is:</p>
    <p style="font-size:32px;letter-spacing:0.28em;margin:0 0 16px;font-family:ui-monospace,monospace;">${code}</p>
    <p style="color:#9aa5b5;font-size:14px;margin:0;">It expires in 10 minutes. If you did not ask to reset your password, ignore this email.</p>
  </body>
</html>`;
}
