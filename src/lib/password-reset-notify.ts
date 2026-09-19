import { isDemoEmail, normalizeEmail } from "./otp";
import { isAdministrator, POOL_ROLES } from "./roles";

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

/** Union of PoolAccessRole administrator, membership.isAdmin, and role=admin. */
export function resetAdminUserIds(
  members: Array<{ userId: string; role: string; isAdmin?: boolean | null }>,
  grants: Array<{ userId: string; role: string }>
): string[] {
  const ids = new Set<string>();
  for (const grant of grants) {
    if (grant.role === POOL_ROLES.administrator && grant.userId) {
      ids.add(grant.userId);
    }
  }
  for (const member of members) {
    if (isAdministrator(member) && member.userId) ids.add(member.userId);
  }
  return [...ids];
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

/** Skip demo seats. Empty / whitespace phones are dropped. */
export function collectAdminPhones(
  users: Array<{ phoneE164?: string | null; email?: string | null }>
): string[] {
  const out = new Set<string>();
  for (const user of users) {
    if (isDemoEmail(user.email ?? "")) continue;
    const phone = (user.phoneE164 ?? "").trim();
    if (phone) out.add(phone);
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
