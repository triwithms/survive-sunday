"use client";

import { useEffect, useState } from "react";
import {
  CORE_NOTIFICATION_TYPES,
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_COPY,
  OPTIONAL_NOTIFICATION_TYPES,
  type NotificationPrefs,
  type NotificationType,
} from "@/lib/notification-types";

function ToggleRow({
  type,
  on,
  disabled,
  onToggle,
}: {
  type: NotificationType;
  on: boolean;
  disabled?: boolean;
  onToggle: (type: NotificationType, next: boolean) => void;
}) {
  const copy = NOTIFICATION_COPY[type];
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-stadium-border last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-[var(--text-primary)]">{copy.label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{copy.hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={copy.label}
        disabled={disabled}
        data-testid={`pref-${type}`}
        onClick={() => onToggle(type, !on)}
        className={[
          "shrink-0 w-12 h-7 rounded-full border transition-colors mt-0.5",
          on
            ? "bg-field-400/90 border-field-400"
            : "bg-stadium-700 border-stadium-border",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        <span
          className={[
            "block h-6 w-6 rounded-full bg-white shadow transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export function NotificationPrefsForm({
  initial,
  initialError,
}: {
  initial?: NotificationPrefs;
  initialError?: string | null;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    initial ?? DEFAULT_NOTIFICATION_PREFS
  );
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(initial));
  const [error, setError] = useState(initialError ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account/notifications", {
          credentials: "same-origin",
        });
        const data = (await res.json()) as {
          prefs?: NotificationPrefs;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Couldn’t load preferences");
          return;
        }
        if (!cancelled && data.prefs) {
          setPrefs(data.prefs);
          setLoaded(true);
        }
      } catch {
        if (!cancelled) setError("Network error — try again");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial]);

  function toggle(type: NotificationType, next: boolean) {
    setSaved(false);
    setPrefs((prev) => ({ ...prev, [type]: next }));
  }

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/account/notifications", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = (await res.json()) as {
        prefs?: NotificationPrefs;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Couldn’t save preferences");
        return;
      }
      if (data.prefs) setPrefs(data.prefs);
      setSaved(true);
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wide">
          Core — on by default
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-1">
          These keep the pool healthy. Turn one off if you really don’t want it.
        </p>
        {CORE_NOTIFICATION_TYPES.map((type) => (
          <ToggleRow
            key={type}
            type={type}
            on={prefs[type]}
            disabled={busy || !loaded}
            onToggle={toggle}
          />
        ))}
      </section>

      <section className="card-glass p-4">
        <h2 className="text-sm font-semibold text-gold-400 uppercase tracking-wide">
          Optional — off unless you want them
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-1">
          Noisier. Friends usually leave these off.
        </p>
        {OPTIONAL_NOTIFICATION_TYPES.map((type) => (
          <ToggleRow
            key={type}
            type={type}
            on={prefs[type]}
            disabled={busy || !loaded}
            onToggle={toggle}
          />
        ))}
        <div className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-muted)]">
              Phone alerts (coming soon)
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Home Screen push is not wired yet. Email (and missing-pick texts)
              work today.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={false}
            aria-label="Phone alerts (coming soon)"
            disabled
            className="shrink-0 w-12 h-7 rounded-full border bg-stadium-700 border-stadium-border opacity-50 mt-0.5"
          >
            <span className="block h-6 w-6 rounded-full bg-white/70 shadow translate-x-0.5" />
          </button>
        </div>
      </section>

      {error && (
        <p
          className="text-crimson-400 text-sm"
          role="alert"
          data-testid="prefs-load-error"
        >
          {error}
        </p>
      )}
      {saved && (
        <p className="text-field-400 text-sm" data-testid="prefs-saved">
          Saved. We’ll only send what you left on.
        </p>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy || !loaded}
        data-testid="save-notification-prefs"
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save preferences"}
      </button>
    </div>
  );
}
