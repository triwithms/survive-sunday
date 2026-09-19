import {
  mergeNotificationPrefs,
  NOTIFICATION_TYPES,
  type NotificationPrefs,
  type NotificationType,
} from "./notification-types";
import type { TypeChannel } from "./notify-pref";

export type PrefsRow = {
  masterOn?: boolean;
  channelsJson?: string | null;
  pushEnabled?: boolean;
};

export function prefsFromRow(row?: PrefsRow | null): NotificationPrefs {
  let parsed: unknown = null;
  try {
    parsed = row?.channelsJson ? JSON.parse(row.channelsJson) : null;
  } catch {
    parsed = null;
  }
  const channels =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  return mergeNotificationPrefs({
    ...channels,
    masterOn: row?.masterOn,
    pushEnabled: row?.pushEnabled,
  });
}

/** Prisma write shape: keep leftover boolean columns in sync (on ≠ off). */
export function preferenceColumns(prefs: NotificationPrefs) {
  return {
    masterOn: prefs.masterOn,
    channelsJson: JSON.stringify(
      Object.fromEntries(NOTIFICATION_TYPES.map((key) => [key, prefs[key]]))
    ),
    missingPickReminder: prefs.missingPickReminder !== "off",
    pickConfirmed: prefs.pickConfirmed !== "off",
    resultsGraded: prefs.resultsGraded !== "off",
    eliminationMulligan: prefs.eliminationMulligan !== "off",
    poolAnnouncements: prefs.poolAnnouncements !== "off",
    scoreUpdates: prefs.scoreUpdates !== "off",
    injuryNotes: prefs.injuryNotes !== "off",
    pushEnabled: prefs.pushEnabled,
  };
}

export function channelsOf(
  prefs: NotificationPrefs
): Record<NotificationType, TypeChannel> {
  return Object.fromEntries(
    NOTIFICATION_TYPES.map((key) => [key, prefs[key]])
  ) as Record<NotificationType, TypeChannel>;
}
