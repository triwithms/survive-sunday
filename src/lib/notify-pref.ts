/** Channel preference stored on User.notifyPref. */

export const NOTIFY_PREFS = ["email", "sms", "both", "none"] as const;
export type NotifyPref = (typeof NOTIFY_PREFS)[number];

export const NOTIFY_CHANNELS = ["email", "sms"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

export const NOTIFY_PREF_LABELS: Record<NotifyPref, string> = {
  email: "Email",
  sms: "SMS",
  both: "both",
  none: "none",
};

export function isNotifyPref(value: unknown): value is NotifyPref {
  return typeof value === "string" && (NOTIFY_PREFS as readonly string[]).includes(value);
}

export function parseNotifyPref(value: unknown): NotifyPref | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  return isNotifyPref(key) ? key : null;
}

/** Has email → email. Phone-only or neither → none (never auto-opt into SMS). */
export function defaultNotifyPref(user: {
  email?: string | null;
  phoneE164?: string | null;
}): NotifyPref {
  const email = (user.email ?? "").trim();
  if (email.includes("@")) return "email";
  return "none";
}

export function parseNotifyPrefBody(body: unknown):
  | { ok: true; pref: NotifyPref }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid preferences" };
  }
  const raw = (body as { pref?: unknown }).pref;
  const pref = parseNotifyPref(raw);
  if (!pref) return { ok: false, error: "Choose Email, SMS, both, or none" };
  return { ok: true, pref };
}
