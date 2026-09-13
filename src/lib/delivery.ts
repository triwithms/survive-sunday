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

export function fromEmail(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Survive Sunday <beth.t@example.com>"
  );
}

export async function sendResendMessage(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<DeliverResult> {
  if (!emailProviderReady()) {
    if (canStubDelivery()) {
      console.info(`[delivery] email stub → ${opts.to}: ${opts.subject}`);
      return { ok: true, stubbed: true };
    }
    return {
      ok: false,
      error:
        "We couldn’t email that. The commissioner still needs to add the Resend key (see DEPLOY.md).",
    };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail(),
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[delivery] Resend failed", res.status, body.slice(0, 400));
      return { ok: false, error: "We couldn’t send the email. Try again in a moment." };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[delivery] Resend error", error);
    return { ok: false, error: "We couldn’t send the email. Try again in a moment." };
  }
}

export async function sendTwilioMessage(opts: {
  to: string;
  body: string;
}): Promise<DeliverResult> {
  if (!smsProviderReady()) {
    if (canStubDelivery()) {
      console.info(`[delivery] SMS stub → ${opts.to}: ${opts.body}`);
      return { ok: true, stubbed: true };
    }
    return {
      ok: false,
      error: "Text messages aren’t set up yet.",
    };
  }
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
          To: opts.to,
          Body: opts.body,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[delivery] Twilio failed", res.status, body.slice(0, 400));
      return { ok: false, error: "We couldn’t send the text." };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[delivery] Twilio error", error);
    return { ok: false, error: "We couldn’t send the text." };
  }
}

export function stadiumEmailHtml(opts: {
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html>
  <body style="background:#0b0e12;color:#f2f4f7;font-family:Georgia,serif;padding:24px;">
    <p style="color:#e8c547;font-size:20px;letter-spacing:0.08em;margin:0 0 16px;">SURVIVE SUNDAY</p>
    <p style="font-size:18px;margin:0 0 12px;">${opts.heading}</p>
    ${opts.bodyHtml}
    <p style="color:#9aa5b5;font-size:13px;margin:24px 0 0;">You can change what we send from Account → Notification preferences. Password-reset codes are always sent when you ask for one.</p>
  </body>
</html>`;
}
