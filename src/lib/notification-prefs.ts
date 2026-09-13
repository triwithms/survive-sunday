import { prisma } from "./db";
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergeNotificationPrefs,
  type NotificationPrefs,
} from "./notification-types";

export async function getNotificationPrefs(
  userId: string
): Promise<NotificationPrefs> {
  const row = await prisma.notificationPreference.findUnique({
    where: { userId },
  });
  return mergeNotificationPrefs(row);
}

export async function ensureNotificationPrefs(
  userId: string
): Promise<NotificationPrefs> {
  const row = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...DEFAULT_NOTIFICATION_PREFS },
    update: {},
  });
  return mergeNotificationPrefs(row);
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefs> {
  const row = await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, ...prefs },
    update: { ...prefs },
  });
  return mergeNotificationPrefs(row);
}
