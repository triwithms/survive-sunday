import { hasGameNoticeTip } from "./notify-game-footer";
import { fitTrialSms } from "./sms-gsm";

export type DeliverResult =
  | { ok: true; stubbed: boolean }
  | { ok: false; error: string };

/** Resend’s sandbox sender — only delivers to the Resend login email, not friends. */
export const RESEND_TEST_FROM = "beth.t@example.com";

export function trimEnvValue(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/^['"]+|['"]+$/g, "").trim();
}

export function resendApiKey(): string {
  return trimEnvValue(process.env.RESEND_API_KEY);
}

export function configuredFromEmail(): string {
  return trimEnvValue(process.env.RESEND_FROM_EMAIL);
}

/**
 * Pull the actual address out of `Name <addr@host>` or a bare address.
 */
export function extractEmailAddress(from: string): string {
  const trimmed = from.trim();
  const angled = trimmed.match(/<([^>]+)>/);
  const address = (angled ? angled[1] : trimmed).trim().toLowerCase();
  return address;
}

export function isResendTestingFrom(from: string): boolean {
  const address = extractEmailAddress(from);
  if (!address) return false;
  return (
    address === RESEND_TEST_FROM ||
    address.endsWith("@resend.dev")
  );
}

export function fromEmail(): string {
  const configured = configuredFromEmail();
  if (configured) return configured;
  if (canStubDelivery()) {
    return `Survive Sunday <${RESEND_TEST_FROM}>`;
  }
  return "";
}

export function emailProviderReady(): boolean {
  const from = configuredFromEmail();
  if (!resendApiKey() || !from) return false;
  // Sandbox From is fine on a laptop (only the Resend login inbox).
  // Production must use a verified domain so friends actually receive mail.
  if (isResendTestingFrom(from) && !canStubDelivery()) return false;
  return true;
}

export function smsProviderReady(): boolean {
  return Boolean(
    trimEnvValue(process.env.TWILIO_ACCOUNT_SID) &&
      trimEnvValue(process.env.TWILIO_AUTH_TOKEN) &&
      trimEnvValue(process.env.TWILIO_FROM_NUMBER)
  );
}

export function canStubDelivery(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function missingEmailConfigError(): string {
  const key = resendApiKey();
  const from = configuredFromEmail();
  if (!key && !from) {
    return "We couldn’t email a code. Production is missing both RESEND_API_KEY and RESEND_FROM_EMAIL. On Vercel: nfl-pool → survive-sunday → Settings → Environment Variables. Add both for Production, then Deployments → ⋮ → Redeploy (do not use the build cache).";
  }
  if (!key) {
    return "We couldn’t email a code. Production is missing RESEND_API_KEY (or it is blank). On Vercel: Settings → Environment Variables → RESEND_API_KEY must be ticked for Production, then Redeploy.";
  }
  if (!from) {
    return "We couldn’t email a code. Production is missing RESEND_FROM_EMAIL. Set it to an address on a domain Resend has Verified — not onboarding@resend.dev. Then Redeploy.";
  }
  if (isResendTestingFrom(from)) {
    return "We couldn’t email a code. RESEND_FROM_EMAIL is still the Resend test address (onboarding@resend.dev). That only delivers to the Resend login email, not friends. Use Survive Sunday <noreply@your-verified-domain> then Redeploy.";
  }
  return "We couldn’t email a code. The Resend keys on Vercel Production still look incomplete. Check RESEND_API_KEY and RESEND_FROM_EMAIL, then Redeploy.";
}

export function parseResendErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  try {
    const parsed = JSON.parse(trimmed) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    /* plain text */
  }
  return trimmed.slice(0, 280);
}

export function explainResendFailure(status: number, body: string): string {
  const message = parseResendErrorBody(body);
  const lower = message.toLowerCase();

  if (
    /own email|testing emails|only send testing/i.test(lower)
  ) {
    return "Resend is still in test mode. The From address only delivers to the Resend login email, not friends. On Vercel, set RESEND_FROM_EMAIL to an address on a verified domain (not onboarding@resend.dev), then Redeploy.";
  }
  if (status === 401 || /invalid.*api key|api key is invalid|unauthorized/i.test(lower)) {
    return "The Resend API key on Vercel is missing, wrong, or expired. Open Settings → Environment Variables → RESEND_API_KEY (Production), paste a new key from resend.com → API Keys, then Redeploy.";
  }
  if (
    /domain/i.test(lower) &&
    /not verified|unverified|not found|verify/i.test(lower)
  ) {
    return "The From email’s domain is not verified in Resend. At resend.com → Domains, wait until it says Verified. Then set RESEND_FROM_EMAIL to an address on that domain and Redeploy.";
  }
  if (status === 403 || /forbidden|restricted/i.test(lower)) {
    return "Resend refused that send. Usually the API key is restricted, or the From address is not allowed. Check resend.com → API Keys and Domains, and that Vercel Production has the matching RESEND_FROM_EMAIL.";
  }
  if (
    status === 422 ||
    /invalid.*from|from.*invalid|invalid `from`/i.test(lower)
  ) {
    return "The From address (RESEND_FROM_EMAIL) is not allowed. Use an address on your verified Resend domain, like Survive Sunday <noreply@yourdomain.com> — not onboarding@resend.dev.";
  }
  if (status === 429 || /rate limit/i.test(lower)) {
    return "Resend is rate-limiting us. Wait a minute and try again.";
  }
  if (message) {
    return `We couldn’t send the email (${message}). Check RESEND_API_KEY and RESEND_FROM_EMAIL on Vercel Production, then Redeploy.`;
  }
  return "We couldn’t send the email. Check Resend and the Vercel Production keys, then try again.";
}

export type EmailDeliveryStatus = {
  ready: boolean;
  hasApiKey: boolean;
  hasFromEmail: boolean;
  fromIsTestAddress: boolean;
  fromAddressMasked: string | null;
  smsReady: boolean;
  message: string;
};

function maskFromAddress(from: string): string {
  const address = extractEmailAddress(from);
  const at = address.indexOf("@");
  if (at < 1) return "set (could not read the address)";
  const local = address.slice(0, at);
  const domain = address.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}•••@${domain}`;
}

export function readEmailDeliveryStatus(): EmailDeliveryStatus {
  const key = Boolean(resendApiKey());
  const from = configuredFromEmail();
  const fromIsTest = from ? isResendTestingFrom(from) : false;
  const ready = emailProviderReady();
  let message: string;
  if (ready) {
    message =
      "Email sending is configured. Forgot-password codes should arrive. If a friend still gets nothing, check spam and Resend → Logs.";
  } else if (canStubDelivery()) {
    message =
      "This is a local/dev server. Codes are shown on the page instead of emailed.";
  } else {
    message = missingEmailConfigError();
  }
  return {
    ready,
    hasApiKey: key,
    hasFromEmail: Boolean(from),
    fromIsTestAddress: fromIsTest,
    fromAddressMasked: from ? maskFromAddress(from) : null,
    smsReady: smsProviderReady(),
    message,
  };
}

export async function sendResendMessage(opts: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<DeliverResult> {
  if (!emailProviderReady()) {
    if (canStubDelivery() && !resendApiKey()) {
      console.info(`[delivery] email stub → ${opts.to}: ${opts.subject}`);
      return { ok: true, stubbed: true };
    }
    return { ok: false, error: missingEmailConfigError() };
  }
  const from = fromEmail();
  const apiKey = resendApiKey();
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[delivery] Resend failed",
        res.status,
        extractEmailAddress(from),
        body.slice(0, 400)
      );
      return { ok: false, error: explainResendFailure(res.status, body) };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[delivery] Resend error", error);
    return {
      ok: false,
      error:
        "We couldn’t reach Resend. Check the site is allowed to send outbound HTTPS, then try again.",
    };
  }
}

export async function sendTwilioMessage(opts: {
  to: string;
  body: string;
}): Promise<DeliverResult> {
  const body = fitTrialSms(opts.body);
  if (!smsProviderReady()) {
    if (canStubDelivery()) {
      console.info(`[delivery] SMS stub → ${opts.to}: ${body}`);
      return { ok: true, stubbed: true };
    }
    return {
      ok: false,
      error: "Text messages aren’t set up yet. Ask for an email code instead.",
    };
  }
  const sid = trimEnvValue(process.env.TWILIO_ACCOUNT_SID);
  const token = trimEnvValue(process.env.TWILIO_AUTH_TOKEN);
  const from = trimEnvValue(process.env.TWILIO_FROM_NUMBER);
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
          Body: body,
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[delivery] Twilio failed", res.status, body.slice(0, 400));
      return {
        ok: false,
        error:
          "We couldn’t send the text. Check the Twilio keys on Vercel, or ask for an email code instead.",
      };
    }
    return { ok: true, stubbed: false };
  } catch (error) {
    console.error("[delivery] Twilio error", error);
    return {
      ok: false,
      error: "We couldn’t send the text. Ask for an email code instead.",
    };
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
    ${
      hasGameNoticeTip(opts.bodyHtml)
        ? ""
        : `<p style="margin:24px 0 0;font-size:12px;line-height:16px;color:#9aa5b5;">You can change what we send from Account → Notification preferences. Password-reset codes are always sent when you ask for one.</p>`
    }
  </body>
</html>`;
}
