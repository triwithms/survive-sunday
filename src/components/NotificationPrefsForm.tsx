"use client";

import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_TYPES,
  type NotificationPrefs,
} from "@/lib/notification-types";
import { NotifyChannelSelect, channelFromOn } from "./NotifyChannelSelect";

const COMING_SOON = "Coming soon — notifications not sending yet";

export function NotificationPrefsForm({
  initial,
  initialError,
}: {
  initial?: NotificationPrefs;
  initialError?: string | null;
}) {
  const prefs = initial ?? DEFAULT_NOTIFICATION_PREFS;
  return (
    <div className="space-y-4">
      <fieldset
        disabled
        className="card-glass space-y-1 p-4 opacity-70"
        data-testid="notification-prefs-form"
      >
        <legend className="px-1 text-sm font-semibold text-gold-400 uppercase tracking-wide">
          Notifications
        </legend>
        <p className="text-xs text-[var(--text-muted)] mb-2">{COMING_SOON}</p>
        {NOTIFICATION_TYPES.map((type) => (
          <NotifyChannelSelect
            key={type}
            type={type}
            value={channelFromOn(prefs[type])}
          />
        ))}
      </fieldset>
      {initialError ? (
        <p
          className="text-crimson-400 text-sm"
          role="alert"
          data-testid="prefs-load-error"
        >
          {initialError}
        </p>
      ) : null}
    </div>
  );
}
