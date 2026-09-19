import { prisma } from "./db";
import { ensureNotificationPrefs } from "./notification-prefs";
import type { NotificationType } from "./notification-types";
import { channelsOf } from "./notify-pref-columns";
import {
  defaultNotifyPref,
  parseNotifyPref,
  type NotifyPref,
  type TypeChannel,
} from "./notify-pref";
import { ensureUserNotifyPref } from "./notify-pref-schema";

export type HydratedTarget = {
  userId: string;
  email?: string | null;
  phoneE164?: string | null;
  notifyPref: NotifyPref;
  masterOn: boolean;
  channels: Record<NotificationType, TypeChannel>;
};

export async function loadNotifyPref(userId: string) {
  const prefs = await ensureNotificationPrefs(userId);
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { notifyPref: true, email: true, phoneE164: true },
    });
    if (!row) {
      return { pref: "none" as const, email: null, phoneE164: null, prefs };
    }
    return {
      pref: parseNotifyPref(row.notifyPref) ?? defaultNotifyPref(row),
      email: row.email,
      phoneE164: row.phoneE164,
      prefs,
    };
  } catch (error) {
    console.error("[notify] load pref failed", error);
    await ensureUserNotifyPref(prisma).catch(() => undefined);
    return { pref: "none" as const, email: null, phoneE164: null, prefs };
  }
}

export async function hydrateNotifyTarget(target: {
  userId: string;
  email?: string | null;
  phoneE164?: string | null;
  notifyPref?: string | null;
}): Promise<HydratedTarget> {
  const stored = await loadNotifyPref(target.userId);
  return {
    userId: target.userId,
    email: target.email ?? stored.email,
    phoneE164: target.phoneE164 ?? stored.phoneE164,
    notifyPref: parseNotifyPref(target.notifyPref) ?? stored.pref,
    masterOn: stored.prefs.masterOn,
    channels: channelsOf(stored.prefs),
  };
}
