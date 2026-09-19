import { prisma } from "./db";
import {
  ensureNotificationPrefs,
  saveNotificationPrefs,
} from "./notification-prefs";
import type { NotificationPrefs } from "./notification-types";
import { parseNotifyPref, type NotifyPref } from "./notify-pref";

export async function saveNotifyState(
  userId: string,
  prefs: NotificationPrefs
): Promise<NotificationPrefs> {
  const saved = await saveNotificationPrefs(userId, prefs);
  const existing = await prisma.user
    .findUnique({ where: { id: userId }, select: { notifyPref: true } })
    .catch(() => null);
  const onPref = parseNotifyPref(existing?.notifyPref);
  await prisma.user.update({
    where: { id: userId },
    data: {
      notifyPref: saved.masterOn
        ? onPref && onPref !== "none"
          ? onPref
          : "email"
        : "none",
    },
  });
  return saved;
}

export async function saveNotifyPref(
  userId: string,
  pref: NotifyPref
): Promise<NotifyPref> {
  const prefs = await ensureNotificationPrefs(userId);
  await saveNotifyState(userId, { ...prefs, masterOn: pref !== "none" });
  return pref;
}
