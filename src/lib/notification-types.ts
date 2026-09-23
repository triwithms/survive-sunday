/** Alert types. Channel per type is email | sms | both | off. */

import { parseTypeChannel, type TypeChannel } from "./notify-pref";

// parseTypeChannel is used by mergeNotificationPrefs.

export const NOTIFICATION_TYPES = [
  "missingPickReminder",
  "pickConfirmed",
  "resultsGraded",
  "weekWrap",
  "eliminationMulligan",
  "poolAnnouncements",
  "scoreUpdates",
  "injuryNotes",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationPrefs = Record<NotificationType, TypeChannel> & {
  masterOn: boolean;
  pushEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  missingPickReminder: "both",
  pickConfirmed: "email",
  resultsGraded: "email",
  weekWrap: "email",
  eliminationMulligan: "both",
  poolAnnouncements: "email",
  scoreUpdates: "off",
  injuryNotes: "off",
  masterOn: true,
  pushEnabled: false,
};

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    typeof value === "string" &&
    (NOTIFICATION_TYPES as readonly string[]).includes(value)
  );
}

function channelOf(
  value: unknown,
  fallback: TypeChannel
): TypeChannel {
  return parseTypeChannel(value) ?? fallback;
}

export function mergeNotificationPrefs(
  row?: Partial<NotificationPrefs> | Record<string, unknown> | null
): NotificationPrefs {
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...Object.fromEntries(
      NOTIFICATION_TYPES.map((key) => [
        key,
        channelOf(row?.[key], DEFAULT_NOTIFICATION_PREFS[key]),
      ])
    ),
    masterOn:
      typeof row?.masterOn === "boolean"
        ? row.masterOn
        : DEFAULT_NOTIFICATION_PREFS.masterOn,
    pushEnabled:
      typeof row?.pushEnabled === "boolean"
        ? row.pushEnabled
        : DEFAULT_NOTIFICATION_PREFS.pushEnabled,
  };
}

export function isTypeEnabled(
  prefs: NotificationPrefs | null | undefined,
  type: NotificationType
): boolean {
  const merged = mergeNotificationPrefs(prefs);
  return merged.masterOn && merged[type] !== "off";
}

export {
  CORE_NOTIFICATION_TYPES,
  NOTIFICATION_COPY,
  OPTIONAL_NOTIFICATION_TYPES,
} from "./notification-labels";
export { parsePreferencePatch } from "./notification-parse";
export {
  isAccountRecoveryChannel,
  isDemoRecipient,
  isMissingPickReminderWindow,
  MISSING_PICK_REMIND_WINDOW_MS,
  shouldSendMissingPickSms,
  shouldSendPoolEmail,
} from "./notification-gates";
