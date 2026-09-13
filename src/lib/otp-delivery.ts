import type { OtpChannel } from "./otp";
import {
  canStubDelivery,
  emailProviderReady,
  sendEmail,
  sendSms,
  smsProviderReady,
} from "./message-delivery";

export type DeliverResult =
  | { ok: true; stubbed: boolean }
  | { ok: false; error: string };

export { emailProviderReady, smsProviderReady, canStubDelivery };

export function canRevealDevCode(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Password-reset codes. Transactional — never gated by Account
 * notification preferences.
 */
export async function deliverOtp(
  channel: OtpChannel,
  destination: string,
  code: string
): Promise<DeliverResult> {
  if (channel === "sms") {
    const result = await sendSms({
      to: destination,
      body: `${code} is your Survive Sunday password-reset code. It expires in 10 minutes.`,
    });
    if (!result.ok) {
      return {
        ok: false,
        error:
          result.error === "Text messages aren’t set up yet."
            ? "Text messages aren’t set up yet. Ask for an email code instead."
            : "We couldn’t send the text. Try email instead.",
      };
    }
    return { ok: true, stubbed: result.stubbed };
  }

  const result = await sendEmail({
    to: destination,
    subject: "Your Survive Sunday password-reset code",
    text: emailText(code),
    html: emailHtml(code),
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, stubbed: result.stubbed };
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
