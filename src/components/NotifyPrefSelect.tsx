"use client";

import {
  NOTIFY_PREF_LABELS,
  NOTIFY_PREFS,
  type NotifyPref,
} from "@/lib/notify-pref";

export function NotifyPrefSelect({
  value,
  onChange,
  disabled,
  testId = "notify-pref",
}: {
  value: NotifyPref;
  onChange: (pref: NotifyPref) => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-3 py-2">
      <span className="min-w-0">
        <span className="block font-medium text-[var(--text-primary)]">
          How we reach you
        </span>
        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
          Game notices (reminders, you’re out). Password-reset codes still send
          when you ask.
        </span>
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as NotifyPref)}
        aria-label="Notification preference — SMS, Email, both, or none"
        data-testid={testId}
        className="shrink-0 mt-0.5 max-w-[7.5rem]"
      >
        {NOTIFY_PREFS.map((pref) => (
          <option key={pref} value={pref}>
            {NOTIFY_PREF_LABELS[pref]}
          </option>
        ))}
      </select>
    </label>
  );
}
