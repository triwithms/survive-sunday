import { prisma } from "./db";
import {
  PREFS_LOAD_ERROR,
  PREFS_SAVE_ERROR,
  ensureNotificationTables,
  isMissingNotificationSchema,
} from "./notification-schema";

export { PREFS_LOAD_ERROR, PREFS_SAVE_ERROR };
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergeNotificationPrefs,
  type NotificationPrefs,
} from "./notification-types";
import { preferenceColumns, prefsFromRow } from "./notify-pref-columns";

export type NotificationPrefsResult = {
  prefs: NotificationPrefs;
  error: string | null;
};

export { prefsFromRow };

async function withTables<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await ensureNotificationTables(prisma);
    return await fn();
  } catch (error) {
    if (!isMissingNotificationSchema(error)) throw error;
    await ensureNotificationTables(prisma);
    return await fn();
  }
}

export async function getNotificationPrefs(
  userId: string
): Promise<NotificationPrefs> {
  try {
    const row = await withTables(() =>
      prisma.notificationPreference.findUnique({ where: { userId } })
    );
    return prefsFromRow(row);
  } catch (error) {
    console.error("[notifications] get prefs failed", error);
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export async function ensureNotificationPrefs(userId: string) {
  return (await ensureNotificationPrefsSafe(userId)).prefs;
}

export async function ensureNotificationPrefsSafe(
  userId: string
): Promise<NotificationPrefsResult> {
  try {
    const row = await withTables(() =>
      prisma.notificationPreference.upsert({
        where: { userId },
        create: { userId, ...preferenceColumns(DEFAULT_NOTIFICATION_PREFS) },
        update: {},
      })
    );
    return { prefs: prefsFromRow(row), error: null };
  } catch (error) {
    console.error("[notifications] ensure prefs failed", error);
    return { prefs: DEFAULT_NOTIFICATION_PREFS, error: PREFS_LOAD_ERROR };
  }
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefs> {
  const columns = preferenceColumns(mergeNotificationPrefs(prefs));
  const row = await withTables(() =>
    prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...columns },
      update: columns,
    })
  );
  return prefsFromRow(row);
}

export async function saveNotificationPrefsSafe(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefsResult> {
  try {
    return { prefs: await saveNotificationPrefs(userId, prefs), error: null };
  } catch (error) {
    console.error("[notifications] save prefs failed", error);
    return { prefs: mergeNotificationPrefs(prefs), error: PREFS_SAVE_ERROR };
  }
}
