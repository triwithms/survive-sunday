import {
  isTypeEnabled,
  mergeNotificationPrefs,
  type NotificationPrefs,
  type NotificationType,
} from "./notification-types";
import { channelsFromType } from "./notify-pref";

const DEMO_SUFFIX = "@survivesunday.demo";

export function isDemoRecipient(email?: string | null): boolean {
  return (email ?? "").trim().toLowerCase().endsWith(DEMO_SUFFIX);
}

/** Password-reset codes are account recovery — never gated by these prefs. */
export function isAccountRecoveryChannel(purpose?: string | null): boolean {
  return purpose === "password_reset";
}

export function shouldSendPoolEmail(opts: {
  email?: string | null;
  prefs?: NotificationPrefs | null;
  type: NotificationType;
}): { send: boolean; reason: string } {
  const email = (opts.email ?? "").trim();
  if (!email) return { send: false, reason: "no-email" };
  if (isDemoRecipient(email)) return { send: false, reason: "demo-email" };
  const merged = mergeNotificationPrefs(opts.prefs);
  if (!merged.masterOn) return { send: false, reason: "pref-off" };
  if (!channelsFromType(merged[opts.type]).includes("email")) {
    return { send: false, reason: "pref-off" };
  }
  return { send: true, reason: "ok" };
}

export function shouldSendMissingPickSms(opts: {
  phoneE164?: string | null;
  prefs?: NotificationPrefs | null;
}): { send: boolean; reason: string } {
  const phone = (opts.phoneE164 ?? "").trim();
  if (!phone) return { send: false, reason: "no-phone" };
  if (!isTypeEnabled(opts.prefs, "missingPickReminder")) {
    return { send: false, reason: "pref-off" };
  }
  const merged = mergeNotificationPrefs(opts.prefs);
  if (!channelsFromType(merged.missingPickReminder).includes("sms")) {
    return { send: false, reason: "pref-off" };
  }
  return { send: true, reason: "ok" };
}

/** 24h — must stay earlier than ranked auto (~5 min). */
export const MISSING_PICK_REMIND_WINDOW_MS = 24 * 60 * 60 * 1000;

/** True when lock is in the future and within the reminder window. */
export function isMissingPickReminderWindow(
  lockAt: Date | string | number,
  now: Date = new Date()
): boolean {
  const lock = lockAt instanceof Date ? lockAt : new Date(lockAt);
  if (Number.isNaN(lock.getTime())) return false;
  const ms = lock.getTime() - now.getTime();
  return ms > 0 && ms <= MISSING_PICK_REMIND_WINDOW_MS;
}
