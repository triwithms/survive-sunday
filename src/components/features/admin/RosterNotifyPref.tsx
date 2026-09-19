"use client";

import { NotificationPrefsForm } from "@/components/features/account/NotificationPrefsForm";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from "@/lib/notification-types";

export function RosterNotifyPref({
  userId,
  initial,
}: {
  userId: string;
  initial?: NotificationPrefs | null;
}) {
  return (
    <div data-testid="roster-notify-pref">
      <NotificationPrefsForm
        initial={initial ?? DEFAULT_NOTIFICATION_PREFS}
        saveUrl="/api/admin/notify-pref"
        extraBody={{ userId }}
      />
    </div>
  );
}
