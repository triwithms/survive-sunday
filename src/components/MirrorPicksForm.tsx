"use client";

import { useState } from "react";
import type { PickBackupMode } from "@/lib/pick-mirror";
import { MirrorBackupRadios } from "./MirrorBackupRadios";

export type MirrorOption = {
  id: string;
  nickname: string;
  label: string;
};

export function MirrorPicksForm({
  membershipId,
  initialMode,
  saveAsAdmin,
}: {
  membershipId: string;
  initialMode: PickBackupMode;
  saveAsAdmin?: boolean;
}) {
  const [mode, setMode] = useState<PickBackupMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const dirty = mode !== initialMode;

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
          saveAsAdmin ? { membershipId, mode } : { mode }
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
    <div className="space-y-3 min-w-0 max-w-full">
      <MirrorBackupRadios
        membershipId={membershipId}
        mode={mode}
        busy={busy}
        saveAsAdmin={saveAsAdmin}
        onMode={(next) => {
          setMode(next);
          setSaved(false);
        }}
      />
      <p className="text-xs text-[var(--text-muted)] break-words">
        Never overwrites a pick you already made. Ranked auto uses the same{" "}
        <strong>2025 rank #N</strong> list as Pick (1 = strongest), skipping
        used and bye teams, from about 5 minutes before kickoff or lock — each
        use stamps 💩 and you cannot win the pool officially. You can still
        change your own pick until your game kicks off.
      </p>
      {error ? (
        <p className="text-crimson-400 text-sm" role="alert">{error}</p>
      ) : null}
      {saved ? (
        <p className="text-field-400 text-sm" data-testid="mirror-saved">Saved.</p>
      ) : null}
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
