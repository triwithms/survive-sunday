import {
  NOTIFICATION_COPY,
  type NotificationType,
} from "@/lib/notification-types";

export const NOTIFY_CHANNELS = ["sms", "email", "both", "none"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

const LABELS: Record<NotifyChannel, string> = {
  sms: "SMS",
  email: "Email",
  both: "both",
  none: "none",
};

export function channelFromOn(on: boolean): NotifyChannel {
  return on ? "both" : "none";
}

export function NotifyChannelSelect({
  type,
  value,
}: {
  type: NotificationType;
  value: NotifyChannel;
}) {
  const copy = NOTIFICATION_COPY[type];
  return (
    <label className="flex items-start justify-between gap-3 py-3 border-b border-stadium-border last:border-b-0">
      <span className="min-w-0">
        <span className="block font-medium text-[var(--text-primary)]">
          {copy.label}
        </span>
        <span className="block text-xs text-[var(--text-muted)] mt-0.5">
          {copy.hint}
        </span>
      </span>
      <select
        disabled
        value={value}
        aria-label={`${copy.label} — SMS, Email, both, or none`}
        data-testid={`pref-${type}`}
        className="shrink-0 mt-0.5 max-w-[7.5rem]"
      >
        {NOTIFY_CHANNELS.map((ch) => (
          <option key={ch} value={ch}>
            {LABELS[ch]}
          </option>
        ))}
      </select>
    </label>
  );
}
