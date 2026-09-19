"use client";

import {
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "@/lib/notification-types";
import type { TypeChannel } from "@/lib/notify-pref";
import { NotifyTypeRow } from "./NotifyTypeRow";

export function NotifyTypeList({
  prefs,
  onChange,
  disabled,
}: {
  prefs: NotificationPrefs;
  onChange: (type: (typeof NOTIFICATION_TYPES)[number], pref: TypeChannel) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-0" data-testid="notify-type-list">
      {NOTIFICATION_TYPES.map((type) => (
        <NotifyTypeRow
          key={type}
          type={type}
          value={prefs[type]}
          disabled={disabled}
          onChange={(pref) => onChange(type, pref)}
        />
      ))}
    </div>
  );
}
