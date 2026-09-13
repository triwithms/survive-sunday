import type { TwoFactorChannel } from "./two-factor";

export type DeliverResult =
  | { ok: true; stubbed: boolean }
  | { ok: false; error: string };

export function emailProviderReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function smsProviderReady(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

export function canStubDelivery(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function canRevealDevCode(): boolean {
  return process.env.NODE_ENV !== "production";
}

function fromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Survive Sunday <beth.t@example.com>"
  );
}

export async function deliverOtp(
  channel: TwoFactorChannel,
  destination: string,
  code: string
): Promise<DeliverResult> {
  if (channel === "sms") {
    if (smsProviderReady()) return sendTwilioSms(destination, code);
    if (canStubDelivery()) {
      console.info(`[2fa] SMS stub → ${destination}: ${code}`);
      return { ok: true, stubbed: true };
    }
    return {
      ok: false,
      error: "Text messages aren’t set up yet. Ask for an email code instead.",
    };
  }

  if (emailProviderReady()) return sendResendEmail(destination, code);
  if (canStubDelivery()) {
    console.info(`[2fa] email stub → ${destination}: ${code}`);
    return { ok: true, stubbed: true };
  }
  return {
    ok: false,
    error:
      "We couldn’t email a code. The commissioner still needs to add the Resend key (see DEPLOY.md).",
  };
}

async function sendResendEmail(to: string, code: string): Promise<DeliverResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail(),
        to: [to],
        subject: "Your Survive Sunday sign-in code",
        text: emailText(code),
        html: emailHtml(code),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[2fa] Resend failed", res.status, body.slice(0, 400));
      return { ok: false, error: "We couldn’t send the email. Try again in a moment." };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[2fa] Resend error", error);
    return { ok: false, error: "We couldn’t send the email. Try again in a moment." };
  }
}

async function sendTwilioSms(to: string, code: string): Promise<DeliverResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM_NUMBER!.trim();
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: `${code} is your Survive Sunday sign-in code. It expires in 10 minutes.`,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[2fa] Twilio failed", res.status, body.slice(0, 400));
      return { ok: false, error: "We couldn’t send the text. Try email instead." };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[2fa] Twilio error", error);
    return { ok: false, error: "We couldn’t send the text. Try email instead." };
  }
}

function emailText(code: string): string {
  return [
    `Your Survive Sunday sign-in code is ${code}.`,
    "",
    "It expires in 10 minutes.",
    "If you did not try to sign in, you can ignore this email.",
  ].join("\n");
}

function emailHtml(code: string): string {
  return `<!doctype html>
<html>
  <body style="background:#0b0e12;color:#f2f4f7;font-family:Georgia,serif;padding:24px;">
    <p style="color:#e8c547;font-size:20px;letter-spacing:0.08em;margin:0 0 16px;">SURVIVE SUNDAY</p>
    <p style="margin:0 0 12px;">Your sign-in code is:</p>
    <p style="font-size:32px;letter-spacing:0.28em;margin:0 0 16px;font-family:ui-monospace,monospace;">${code}</p>
    <p style="color:#9aa5b5;font-size:14px;margin:0;">It expires in 10 minutes. If you did not try to sign in, ignore this email.</p>
  </body>
</html>`;
}
