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

export type NotificationPrefsResult = {
  prefs: NotificationPrefs;
  error: string | null;
};

async function withNotificationTables<T>(fn: () => Promise<T>): Promise<T> {
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
    const row = await withNotificationTables(() =>
      prisma.notificationPreference.findUnique({
        where: { userId },
      })
    );
    return mergeNotificationPrefs(row);
  } catch (error) {
    console.error("[notifications] get prefs failed", error);
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

/** Never throws — missing table / RLS / any DB error returns defaults. */
export async function ensureNotificationPrefs(
  userId: string
): Promise<NotificationPrefs> {
  const loaded = await ensureNotificationPrefsSafe(userId);
  return loaded.prefs;
}

export async function ensureNotificationPrefsSafe(
  userId: string
): Promise<NotificationPrefsResult> {
  try {
    const row = await withNotificationTables(() =>
      prisma.notificationPreference.upsert({
        where: { userId },
        create: { userId, ...DEFAULT_NOTIFICATION_PREFS },
        update: {},
      })
    );
    return { prefs: mergeNotificationPrefs(row), error: null };
  } catch (error) {
    console.error("[notifications] ensure prefs failed", error);
    return { prefs: DEFAULT_NOTIFICATION_PREFS, error: PREFS_LOAD_ERROR };
  }
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefs> {
  const row = await withNotificationTables(() =>
    prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...prefs },
      update: { ...prefs },
    })
  );
  return mergeNotificationPrefs(row);
}

export async function saveNotificationPrefsSafe(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefsResult> {
  try {
    const saved = await saveNotificationPrefs(userId, prefs);
    return { prefs: saved, error: null };
  } catch (error) {
    console.error("[notifications] save prefs failed", error);
    return { prefs: mergeNotificationPrefs(prefs), error: PREFS_SAVE_ERROR };
  }
}
