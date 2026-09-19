import { prisma } from "./db";
import { defaultNotifyPref, parseNotifyPref, type NotifyPref } from "./notify-pref";
import { ensureUserNotifyPref } from "./notify-pref-schema";

export type HydratedTarget = {
  userId: string;
  email?: string | null;
  phoneE164?: string | null;
  notifyPref: NotifyPref;
};

export async function loadNotifyPref(userId: string): Promise<{
  pref: NotifyPref;
  email: string | null;
  phoneE164: string | null;
}> {
  try {
    const row = await prisma.user.findUnique({
      where: { id: userId },
      select: { notifyPref: true, email: true, phoneE164: true },
    });
    if (!row) return { pref: "none", email: null, phoneE164: null };
    return {
      pref: parseNotifyPref(row.notifyPref) ?? defaultNotifyPref(row),
      email: row.email,
      phoneE164: row.phoneE164,
    };
  } catch (error) {
    console.error("[notify] load pref failed", error);
    await ensureUserNotifyPref(prisma).catch(() => undefined);
    return { pref: "none", email: null, phoneE164: null };
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
  };
}

export async function saveNotifyPref(
  userId: string,
  pref: NotifyPref
): Promise<NotifyPref> {
  await ensureUserNotifyPref(prisma);
  const row = await prisma.user.update({
    where: { id: userId },
    data: { notifyPref: pref },
    select: { notifyPref: true },
  });
  return parseNotifyPref(row.notifyPref) ?? pref;
}
