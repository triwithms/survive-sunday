import type { NotifyContent } from "./notification-copy";

export const FEEDBACK_MAX_LEN = 800;

export function parseFeedbackMessage(body: unknown):
  | { ok: true; message: string }
  | { ok: false; error: string } {
  const raw =
    body && typeof body === "object" && "message" in body
      ? (body as { message: unknown }).message
      : undefined;
  const message = typeof raw === "string" ? raw.trim() : "";
  if (!message) return { ok: false, error: "Write a short note first." };
  if (message.length > FEEDBACK_MAX_LEN) {
    return { ok: false, error: `Keep it to ${FEEDBACK_MAX_LEN} characters.` };
  }
  return { ok: true, message };
}

/** Nickname (and email when we have one). Never invent a hardcoded inbox. */
export function feedbackAdminNotifyCopy(
  who: string,
  message: string,
  fromEmail?: string | null
): NotifyContent {
  const label = who.trim() || "A friend";
  const from = (fromEmail ?? "").trim();
  const headline = from
    ? `${label} (${from}) sent a bug or idea:`
    : `${label} sent a bug or idea:`;
  return {
    subject: "Survive Sunday — bug or idea",
    text: `${headline}\n\n${message}`,
    htmlBody: `<p style="margin:0 0 12px;">${escapeHtml(headline)}</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>`,
    smsBody: `${label} sent a bug or idea. Check email for the full note.`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
