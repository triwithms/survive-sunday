import {
  mergeNotificationPrefs,
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "./notification-types";
import { parseTypeChannel } from "./notify-pref";

/** Overlay a patch on stored prefs. Master Off must not reset type channels. */
export function parsePreferencePatch(
  body: unknown,
  current?: NotificationPrefs | null
):
  | { ok: true; prefs: NotificationPrefs }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid preferences" };
  }
  const input = body as Record<string, unknown>;
  const nested =
    input.channels && typeof input.channels === "object"
      ? (input.channels as Record<string, unknown>)
      : input;
  const next = mergeNotificationPrefs(current);
  if ("masterOn" in input) {
    if (typeof input.masterOn !== "boolean") {
      return { ok: false, error: "Notifications must be On or Off" };
    }
    next.masterOn = input.masterOn;
  }
  for (const key of NOTIFICATION_TYPES) {
    if (!(key in nested)) continue;
    const ch = parseTypeChannel(nested[key]);
    if (!ch) {
      return { ok: false, error: "Choose Email, SMS, both, or Off" };
    }
    next[key] = ch;
  }
  return { ok: true, prefs: next };
}
