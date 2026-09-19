/**
 * Categories:
 *   security    — password reset / login. IGNORES prefs.
 *   game        — player notices. Master Off → skip. Else type channel.
 *   admin_alert — pool events to Administrators. Uses that type’s channel
 *                 (not skipped by master Off).
 */
import {
  DEFAULT_NOTIFICATION_PREFS,
  isNotificationType,
} from "./notification-types";
import {
  channelsFromType,
  defaultNotifyPref,
  parseNotifyPref,
  parseTypeChannel,
  type NotifyChannel,
  type NotifyPref,
  type TypeChannel,
} from "./notify-pref";

export const NOTIFY_CATEGORIES = ["security", "game", "admin_alert"] as const;
export type NotifyCategory = (typeof NOTIFY_CATEGORIES)[number];

export type NotifyPerson = {
  email?: string | null;
  phoneE164?: string | null;
  notifyPref?: string | null;
  masterOn?: boolean;
  channels?: Partial<Record<string, string>>;
};

export function prefOf(user: NotifyPerson): NotifyPref {
  return parseNotifyPref(user.notifyPref) ?? defaultNotifyPref(user);
}

export function masterOf(user: NotifyPerson): boolean {
  if (typeof user.masterOn === "boolean") return user.masterOn;
  return prefOf(user) !== "none";
}

export function typeChannelOf(
  user: NotifyPerson,
  type?: string
): TypeChannel {
  if (type && user.channels) {
    const fromMap = parseTypeChannel(user.channels[type]);
    if (fromMap) return fromMap;
  }
  if (type && isNotificationType(type)) {
    return DEFAULT_NOTIFICATION_PREFS[type];
  }
  const legacy = prefOf(user);
  if (legacy === "none") return "off";
  return legacy;
}

export function resolveChannels(
  user: NotifyPerson,
  category: NotifyCategory,
  requested?: NotifyChannel[],
  type?: string
): NotifyChannel[] {
  if (category === "security") {
    if (requested && requested.length > 0) return [...new Set(requested)];
    const has: NotifyChannel[] = [];
    if ((user.email ?? "").trim()) has.push("email");
    if ((user.phoneE164 ?? "").trim()) has.push("sms");
    return has;
  }
  if (category === "game" && !masterOf(user)) return [];
  if (category === "game" && type && !isNotificationType(type)) {
    return ["email", "sms"];
  }
  return channelsFromType(typeChannelOf(user, type));
}

export function contactFor(
  user: NotifyPerson,
  channel: NotifyChannel
): string | null {
  const value =
    channel === "email" ? (user.email ?? "").trim() : (user.phoneE164 ?? "").trim();
  return value || null;
}
