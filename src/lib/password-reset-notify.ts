import { isDemoEmail, normalizeEmail } from "./otp";

/** Nickname or email. Never include a code or password. */
export function resetAdminNotifyCopy(who: string): {
  subject: string;
  text: string;
  html: string;
} {
  const label = who.trim() || "A friend";
  const text = `${label} requested a password reset.`;
  return {
    subject: "Survive Sunday — password reset requested",
    text,
    html: `<p>${escapeHtml(label)} requested a password reset.</p>`,
  };
}

export function adminNotifyLooksSafe(text: string): boolean {
  return !/\b\d{6}\b/.test(text) && !/password\s*[:=]/i.test(text);
}

export function collectAdminEmails(
  users: Array<{ email: string | null | undefined }>
): string[] {
  const out = new Set<string>();
  for (const user of users) {
    const email = normalizeEmail(user.email ?? "");
    if (email.includes("@") && !isDemoEmail(email)) out.add(email);
  }
  return [...out];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => {
    if (ch === "&") return "&amp;";
    if (ch === "<") return "&lt;";
    if (ch === ">") return "&gt;";
    return "&quot;";
  });
}
