import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_TYPES,
} from "@/lib/notification-types";
import { NotifyChannelSelect, channelFromOn } from "@/components/NotifyChannelSelect";

const COMING_SOON = "Coming soon — notifications not sending yet";

export function RosterNotifySoon() {
  return (
    <fieldset
      disabled
      className="space-y-1 rounded-lg border border-stadium-border p-3 opacity-60"
      data-testid="roster-notify-soon"
    >
      <legend className="px-1 text-sm font-medium">Notifications</legend>
      <p className="text-xs text-[var(--text-muted)]">{COMING_SOON}</p>
      {NOTIFICATION_TYPES.map((type) => (
        <NotifyChannelSelect
          key={type}
          type={type}
          value={channelFromOn(DEFAULT_NOTIFICATION_PREFS[type])}
        />
      ))}
    </fieldset>
  );
}
