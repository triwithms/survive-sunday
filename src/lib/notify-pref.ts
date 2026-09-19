/** User.notifyPref (legacy) plus per-type channel (email|sms|both|off). */

export const NOTIFY_PREFS = ["email", "sms", "both", "none"] as const;
export type NotifyPref = (typeof NOTIFY_PREFS)[number];

export const NOTIFY_CHANNELS = ["email", "sms"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

export const TYPE_CHANNELS = ["email", "sms", "both", "off"] as const;
export type TypeChannel = (typeof TYPE_CHANNELS)[number];

export const NOTIFY_PREF_LABELS: Record<NotifyPref, string> = {
  email: "Email",
  sms: "SMS",
  both: "both",
  none: "none",
};

export const TYPE_CHANNEL_LABELS: Record<TypeChannel, string> = {
  email: "Email",
  sms: "SMS",
  both: "both",
  off: "Off",
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

export function isTypeChannel(value: unknown): value is TypeChannel {
  return typeof value === "string" && (TYPE_CHANNELS as readonly string[]).includes(value);
}

export function parseTypeChannel(value: unknown): TypeChannel | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase();
  if (key === "none") return "off";
  return isTypeChannel(key) ? key : null;
}

export function channelsFromType(pref: TypeChannel): NotifyChannel[] {
  if (pref === "off") return [];
  if (pref === "email") return ["email"];
  if (pref === "sms") return ["sms"];
  return ["email", "sms"];
}
