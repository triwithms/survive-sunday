"use client";

import { useState } from "react";
import { parseNotifyPref, type NotifyPref } from "@/lib/notify-pref";
import { NotifyPrefSelect } from "./NotifyPrefSelect";

export function NotificationPrefsForm({
  initial,
  initialError,
}: {
  initial: NotifyPref;
  initialError?: string | null;
}) {
  const [pref, setPref] = useState<NotifyPref>(parseNotifyPref(initial) ?? "email");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(initialError ?? null);

  async function onChange(next: NotifyPref) {
    setPref(next);
    setSaved(false);
    setError(null);
    const res = await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pref: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not save");
      return;
    }
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <fieldset className="card-glass space-y-1 p-4" data-testid="notification-prefs-form">
        <legend className="px-1 text-sm font-semibold text-gold-400 uppercase tracking-wide">
          Notifications
        </legend>
        <NotifyPrefSelect value={pref} onChange={onChange} />
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
