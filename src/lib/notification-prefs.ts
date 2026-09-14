import { prisma } from "./db";
import {
  ensureNotificationTables,
  isMissingNotificationSchema,
} from "./notification-schema";
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergeNotificationPrefs,
  type NotificationPrefs,
} from "./notification-types";

async function withNotificationTables<T>(fn: () => Promise<T>): Promise<T> {
  try {
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
  const row = await withNotificationTables(() =>
    prisma.notificationPreference.findUnique({
      where: { userId },
    })
  );
  return mergeNotificationPrefs(row);
}

export async function ensureNotificationPrefs(
  userId: string
): Promise<NotificationPrefs> {
  const row = await withNotificationTables(() =>
    prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...DEFAULT_NOTIFICATION_PREFS },
      update: {},
    })
  );
  return mergeNotificationPrefs(row);
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
