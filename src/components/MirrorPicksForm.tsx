"use client";

import { useState } from "react";

export type MirrorOption = {
  id: string;
  nickname: string;
  label: string;
};

export function MirrorPicksForm({
  membershipId,
  initialSourceId,
  options,
  saveAsAdmin,
}: {
  membershipId: string;
  initialSourceId: string | null;
  options: MirrorOption[];
  saveAsAdmin?: boolean;
}) {
  const [sourceId, setSourceId] = useState(initialSourceId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty = sourceId !== (initialSourceId ?? "");

  async function save() {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const url = saveAsAdmin ? "/api/admin/mirror" : "/api/account/mirror";
      const res = await fetch(url, {
        method: saveAsAdmin ? "POST" : "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          saveAsAdmin
            ? {
                membershipId,
                sourceMembershipId: sourceId || null,
              }
            : { sourceMembershipId: sourceId || null }
        ),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Couldn’t save pick backup");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">
          If no pick within 30 minutes of kickoff, copy from
        </span>
        <select
          value={sourceId}
          onChange={(e) => {
            setSourceId(e.target.value);
            setSaved(false);
          }}
          disabled={busy}
          className="mt-1 w-full"
          aria-label="Mirror picks from"
          data-testid={
            saveAsAdmin
              ? `admin-mirror-${membershipId}`
              : "account-mirror-from"
          }
        >
          <option value="">Off — I’ll pick myself</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-[var(--text-muted)]">
        Only copies when this seat still has no pick. It never overwrites a pick
        you already made. The deadline is that week’s lock (first kickoff), or
        in Week 1 the source pick’s game kickoff.
      </p>
      {error && (
        <p className="text-crimson-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-field-400 text-sm" data-testid="mirror-saved">
          Saved. We’ll copy only if there’s still no pick in that 30-minute
          window.
        </p>
      )}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy || !dirty}
        data-testid={saveAsAdmin ? undefined : "save-mirror-prefs"}
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save pick backup"}
      </button>
    </div>
  );
}
