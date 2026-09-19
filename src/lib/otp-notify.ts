import { dispatchNotice } from "./notify-dispatch";
import type { NotifyChannel } from "./notify-pref";
import {
  canStubDelivery,
  emailHtml,
  emailProviderReady,
  emailText,
  otpCopyKind,
  otpEmailSubject,
  otpSmsBody,
  type DeliverResult,
} from "./otp-delivery";
import type { OtpChannel } from "./otp";

export async function dispatchOtp(
  user: { id: string; email?: string | null; phoneE164?: string | null },
  channel: OtpChannel,
  code: string,
  purpose: string
): Promise<DeliverResult> {
  const kind = otpCopyKind(purpose);
  const requested: NotifyChannel[] = [channel === "sms" ? "sms" : "email"];
  const result = await dispatchNotice({
    target: { userId: user.id, email: user.email, phoneE164: user.phoneE164 },
    category: "security",
    type: purpose,
    requested,
    dedupeKey: `${purpose}:${Date.now()}:${channel}`,
    content: {
      subject: otpEmailSubject(kind),
      text: emailText(code, kind),
      htmlBody: "",
      html: emailHtml(code, kind),
      smsBody: otpSmsBody(code, kind),
    },
  });
  const row = result.outcomes.find((o) => o.channel === requested[0]);
  if (row?.outcome === "no_contact") {
    return { ok: false, error: "No contact on file for that channel." };
  }
  if (result.emailed || result.texted || row?.outcome === "sent") {
    return { ok: true, stubbed: canStubDelivery() && !emailProviderReady() };
  }
  return {
    ok: false,
    error: result.skipped || "We couldn’t send that code. Try the other channel.",
  };
}
