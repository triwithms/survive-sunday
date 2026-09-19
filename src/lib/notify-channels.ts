/**
 * Preference meanings (User.notifyPref):
 *   email — player notices by email only
 *   sms   — player notices by SMS only
 *   both  — email + SMS
 *   none  — no player notices (reminders, wraps, elimination). In-app still shows.
 *
 * Categories:
 *   security    — password reset / login. IGNORES prefs. Requested/has channels.
 *                 Never blocked by none.
 *   game        — elimination notice to the player, pick reminders. RESPECTS prefs.
 *   admin_alert — pool events to Administrators. Uses that Administrator's prefs,
 *                 not the affected player's.
 *
 * Missing contact: skip that channel, outcome no_contact. No silent fallback.
 */
import {
  defaultNotifyPref,
  parseNotifyPref,
  type NotifyChannel,
  type NotifyPref,
} from "./notify-pref";

export const NOTIFY_CATEGORIES = ["security", "game", "admin_alert"] as const;
export type NotifyCategory = (typeof NOTIFY_CATEGORIES)[number];

export type NotifyPerson = {
  email?: string | null;
  phoneE164?: string | null;
  notifyPref?: string | null;
};

export function prefOf(user: NotifyPerson): NotifyPref {
  return parseNotifyPref(user.notifyPref) ?? defaultNotifyPref(user);
}

export function resolveChannels(
  user: NotifyPerson,
  category: NotifyCategory,
  requested?: NotifyChannel[]
): NotifyChannel[] {
  if (category === "security") {
    if (requested && requested.length > 0) return [...new Set(requested)];
    const has: NotifyChannel[] = [];
    if ((user.email ?? "").trim()) has.push("email");
    if ((user.phoneE164 ?? "").trim()) has.push("sms");
    return has;
  }
  const pref = prefOf(user);
  if (pref === "none") return [];
  if (pref === "email") return ["email"];
  if (pref === "sms") return ["sms"];
  return ["email", "sms"];
}

export function contactFor(
  user: NotifyPerson,
  channel: NotifyChannel
): string | null {
  const value =
    channel === "email" ? (user.email ?? "").trim() : (user.phoneE164 ?? "").trim();
  return value || null;
}
