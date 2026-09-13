"use client";

import { useEffect, useId, useState } from "react";
import { ModalDialog } from "@/components/ModalDialog";
import {
  NOTIFICATION_CATALOG,
  prefsToFields,
  type NotificationField,
  defaultNotificationPrefs,
} from "@/lib/notification-prefs";

type Prefs = Record<NotificationField, boolean>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NotificationPrefsPanel({ open, onOpenChange }: Props) {
  const titleId = useId();
  const [prefs, setPrefs] = useState<Prefs>(prefsToFields(defaultNotificationPrefs()));
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setLoading(true);
    void fetch("/api/account/notifications", { credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          prefs?: Prefs;
        };
        if (!res.ok) {
          setError(data.error || "Couldn’t load preferences");
          return;
        }
        if (data.prefs) setPrefs(data.prefs);
      })
      .catch(() => setError("Network error — try again"))
      .finally(() => setLoading(false));
  }, [open]);

  async function toggle(field: NotificationField, next: boolean) {
    const previous = prefs[field];
    setPrefs((current) => ({ ...current, [field]: next }));
    setBusyKey(field);
    setError("");
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        prefs?: Prefs;
      };
      if (!res.ok) {
        setPrefs((current) => ({ ...current, [field]: previous }));
        setError(data.error || "Couldn’t save preference");
        return;
      }
      if (data.prefs) setPrefs(data.prefs);
    } catch {
      setPrefs((current) => ({ ...current, [field]: previous }));
      setError("Network error — try again");
    } finally {
      setBusyKey(null);
    }
  }

  if (!open) return null;

  return (
    <ModalDialog
      labelledBy={titleId}
      placement="sheet"
      onBackdropClick={busyKey ? undefined : () => onOpenChange(false)}
    >
      <h2 id={titleId} className="font-semibold text-lg text-gold-400">
        Notification preferences
      </h2>
      <p className="text-xs text-[var(--text-muted)]">
        Email and SMS for this pool. Forgot-password codes always send — they
        are not a toggle. Live scores and injury notes start off.
      </p>
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : (
        <ul className="space-y-1" data-testid="notification-prefs-list">
          {NOTIFICATION_CATALOG.map((item) => {
            const on = prefs[item.field];
            const disabled = busyKey === item.field;
            return (
              <li key={item.field}>
                <div className="flex items-center gap-3 min-h-11 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                      {item.hint}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label={item.label}
                    disabled={disabled}
                    data-testid={`pref-${item.field}`}
                    onClick={() => void toggle(item.field, !on)}
                    className={[
                      "relative shrink-0 h-7 w-12 rounded-full transition-colors",
                      on ? "bg-gold-400" : "bg-stadium-700 border border-stadium-border",
                      disabled ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                        on ? "left-5" : "left-0.5",
                      ].join(" ")}
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className="text-crimson-400 text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        className="btn-secondary w-full"
        disabled={Boolean(busyKey)}
        onClick={() => onOpenChange(false)}
      >
        Done
      </button>
    </ModalDialog>
  );
}
