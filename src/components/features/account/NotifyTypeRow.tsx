"use client";

import { NOTIFICATION_COPY } from "@/lib/notification-labels";
import type { NotificationType } from "@/lib/notification-types";
import type { TypeChannel } from "@/lib/notify-pref";
import { NotifyChannelSelect } from "./NotifyChannelSelect";

export function NotifyTypeRow({
  type,
  value,
  onChange,
  disabled,
}: {
  type: NotificationType;
  value: TypeChannel;
  onChange: (pref: TypeChannel) => void;
  disabled?: boolean;
}) {
  const copy = NOTIFICATION_COPY[type];
  return (
    <label className="flex items-start justify-between gap-3 py-2 border-t border-stadium-border first:border-t-0">
      <span className="min-w-0">
        <span className="block font-medium text-[var(--text-primary)]">
          {copy.label}
        </span>
        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
          {copy.hint}
        </span>
      </span>
      <NotifyChannelSelect
        value={value}
        onChange={onChange}
        disabled={disabled}
        label={`${copy.label} channel`}
        testId={`notify-type-${type}`}
      />
    </label>
  );
}
