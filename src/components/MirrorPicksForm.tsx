"use client";

import { useState } from "react";
import {
  PICK_BACKUP_MIRROR,
  PICK_BACKUP_OFF,
  PICK_BACKUP_RANKED,
  type PickBackupMode,
} from "@/lib/pick-mirror";

export type MirrorOption = {
  id: string;
  nickname: string;
  label: string;
};

export function MirrorPicksForm({
  membershipId,
  initialMode,
  initialSourceId,
  options,
  saveAsAdmin,
}: {
  membershipId: string;
  initialMode: PickBackupMode;
  initialSourceId: string | null;
  options: MirrorOption[];
  saveAsAdmin?: boolean;
}) {
  const [mode, setMode] = useState<PickBackupMode>(initialMode);
  const [sourceId, setSourceId] = useState(initialSourceId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty =
    mode !== initialMode || sourceId !== (initialSourceId ?? "");

  async function save() {
    if (mode === PICK_BACKUP_MIRROR && !sourceId) {
      setError("Choose a player to copy from");
      return;
    }
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
                mode,
                sourceMembershipId:
                  mode === PICK_BACKUP_MIRROR ? sourceId || null : null,
              }
            : {
                mode,
                sourceMembershipId:
                  mode === PICK_BACKUP_MIRROR ? sourceId || null : null,
              }
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
      <fieldset className="space-y-2">
        <legend className="text-sm text-[var(--text-muted)]">
          If you still have no pick when time is almost up
        </legend>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name={`backup-${membershipId}`}
            checked={mode === PICK_BACKUP_OFF}
            onChange={() => {
              setMode(PICK_BACKUP_OFF);
              setSaved(false);
            }}
            disabled={busy}
            data-testid={saveAsAdmin ? undefined : "backup-off"}
          />
          <span>Off — I’ll pick myself</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name={`backup-${membershipId}`}
            checked={mode === PICK_BACKUP_MIRROR}
            onChange={() => {
              setMode(PICK_BACKUP_MIRROR);
              setSaved(false);
            }}
            disabled={busy}
            data-testid={saveAsAdmin ? undefined : "backup-mirror"}
          />
          <span>Copy from a pool member if no pick within 30 minutes</span>
        </label>
        {mode === PICK_BACKUP_MIRROR && (
          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setSaved(false);
            }}
            disabled={busy}
            className="ml-6 w-[calc(100%-1.5rem)]"
            aria-label="Mirror picks from"
            data-testid={
              saveAsAdmin
                ? `admin-mirror-${membershipId}`
                : "account-mirror-from"
            }
          >
            <option value="">Choose a player…</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name={`backup-${membershipId}`}
            checked={mode === PICK_BACKUP_RANKED}
            onChange={() => {
              setMode(PICK_BACKUP_RANKED);
              setSaved(false);
            }}
            disabled={busy}
            data-testid={saveAsAdmin ? undefined : "backup-ranked"}
          />
          <span>
            Auto-pick the best remaining <strong>2025 rank</strong> team if no
            pick within 2 minutes
          </span>
        </label>
      </fieldset>
      <p className="text-xs text-[var(--text-muted)]">
        Never overwrites a pick you already made. Copy-from uses that member’s
        team 30 minutes before lock (Week 1: that pick’s kickoff) and does{" "}
        <strong>not</strong> stamp 💩. Ranked uses the same{" "}
        <strong>2025 rank #N</strong> list as Pick (1 = strongest), skipping
        teams you’ve already used and bye weeks, starting 2 minutes before
        week lock — each use stamps 💩 and you cannot win the pool
        officially.
      </p>
      {error && (
        <p className="text-crimson-400 text-sm" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-field-400 text-sm" data-testid="mirror-saved">
          Saved.
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
