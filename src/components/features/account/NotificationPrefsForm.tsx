"use client";

import { useState } from "react";
import {
  mergeNotificationPrefs,
  type NotificationPrefs,
  type NotificationType,
} from "@/lib/notification-types";
import type { TypeChannel } from "@/lib/notify-pref";
import { NotifyMasterToggle } from "./NotifyMasterToggle";
import { NotifyTypeList } from "./NotifyTypeList";
import { patchNotifyPrefs } from "./notify-prefs-save";

export function NotificationPrefsForm({
  initial,
  initialError,
  saveUrl = "/api/account/notifications",
  extraBody,
}: {
  initial: NotificationPrefs;
  initialError?: string | null;
  saveUrl?: string;
  extraBody?: Record<string, string>;
}) {
  const [prefs, setPrefs] = useState(() => mergeNotificationPrefs(initial));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(initialError ?? null);
  const [busy, setBusy] = useState(false);

  async function persist(next: NotificationPrefs) {
    setPrefs(next);
    setSaved(false);
    setError(null);
    setBusy(true);
    const result = await patchNotifyPrefs({ url: saveUrl, prefs: next, extraBody });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <fieldset className="card-glass space-y-3 p-4" data-testid="notification-prefs-form">
        <legend className="px-1 text-sm font-semibold text-gold-400 uppercase tracking-wide">
          Notifications
        </legend>
        <p className="text-xs text-[var(--text-muted)]">
          Game notices. Password-reset codes still send when you ask.
        </p>
        <NotifyMasterToggle
          value={prefs.masterOn}
          disabled={busy}
          onChange={(masterOn) => void persist({ ...prefs, masterOn })} // keep type channels
        />
        {prefs.masterOn ? (
          <NotifyTypeList
            prefs={prefs}
            disabled={busy}
            onChange={(type: NotificationType, channel: TypeChannel) =>
              void persist({ ...prefs, [type]: channel })
            }
          />
        ) : null}
        {saved ? (
          <p className="text-xs text-gold-400" data-testid="prefs-saved">
            Saved
          </p>
        ) : null}
      </fieldset>
      {error ? (
        <p className="text-crimson-400 text-sm" role="alert" data-testid="prefs-load-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
