export type DeliverResult =
  | { ok: true; stubbed: boolean; channel: "email" | "sms" }
  | { ok: false; error: string; channel: "email" | "sms" };

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

export function fromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Survive Sunday <beth.t@example.com>"
  );
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<DeliverResult> {
  if (emailProviderReady()) {
    return sendResendEmail(args);
  }
  if (canStubDelivery()) {
    console.info(`[mail] stub → ${args.to}: ${args.subject}`);
    return { ok: true, stubbed: true, channel: "email" };
  }
  return {
    ok: false,
    channel: "email",
    error:
      "We couldn’t send email. The commissioner still needs to add the Resend key (see DEPLOY.md).",
  };
}

export async function sendSms(args: {
  to: string;
  body: string;
}): Promise<DeliverResult> {
  if (smsProviderReady()) {
    return sendTwilioSms(args);
  }
  if (canStubDelivery()) {
    console.info(`[sms] stub → ${args.to}: ${args.body}`);
    return { ok: true, stubbed: true, channel: "sms" };
  }
  return {
    ok: false,
    channel: "sms",
    error: "Text messages aren’t set up yet.",
  };
}

async function sendResendEmail(args: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<DeliverResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail(),
        to: [args.to],
        subject: args.subject,
        text: args.text,
        html: args.html ?? `<p>${escapeHtml(args.text).replace(/\n/g, "<br/>")}</p>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[mail] Resend failed", res.status, body.slice(0, 400));
      return {
        ok: false,
        channel: "email",
        error: "We couldn’t send the email. Try again in a moment.",
      };
    }
    return { ok: true, stubbed: false, channel: "email" };
  } catch (error) {
    console.error("[mail] Resend error", error);
    return {
      ok: false,
      channel: "email",
      error: "We couldn’t send the email. Try again in a moment.",
    };
  }
}

async function sendTwilioSms(args: {
  to: string;
  body: string;
}): Promise<DeliverResult> {
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
          To: args.to,
          Body: args.body,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[sms] Twilio failed", res.status, body.slice(0, 400));
      return {
        ok: false,
        channel: "sms",
        error: "We couldn’t send the text.",
      };
    }
    return { ok: true, stubbed: false, channel: "sms" };
  } catch (error) {
    console.error("[sms] Twilio error", error);
    return {
      ok: false,
      channel: "sms",
      error: "We couldn’t send the text.",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
