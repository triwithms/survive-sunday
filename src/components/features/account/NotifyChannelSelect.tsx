"use client";

import {
  TYPE_CHANNEL_LABELS,
  TYPE_CHANNELS,
  type TypeChannel,
} from "@/lib/notify-pref";

export function NotifyChannelSelect({
  value,
  onChange,
  disabled,
  label,
  testId,
}: {
  value: TypeChannel;
  onChange: (pref: TypeChannel) => void;
  disabled?: boolean;
  label: string;
  testId?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as TypeChannel)}
      aria-label={label}
      data-testid={testId}
      className="shrink-0 mt-0.5 max-w-[7.5rem]"
    >
      {TYPE_CHANNELS.map((pref) => (
        <option key={pref} value={pref}>
          {TYPE_CHANNEL_LABELS[pref]}
        </option>
      ))}
    </select>
  );
}
