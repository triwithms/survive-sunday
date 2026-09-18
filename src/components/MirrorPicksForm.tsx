"use client";

import { useState } from "react";
import {
  PICK_BACKUP_MIRROR,
  type PickBackupMode,
} from "@/lib/pick-mirror";
import { MirrorBackupRadios } from "./MirrorBackupRadios";

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
  const dirty = mode !== initialMode || sourceId !== (initialSourceId ?? "");

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
    <div className="space-y-3 min-w-0 max-w-full">
      <MirrorBackupRadios
        membershipId={membershipId}
        mode={mode}
        sourceId={sourceId}
        options={options}
        busy={busy}
        saveAsAdmin={saveAsAdmin}
        onMode={(next) => {
          setMode(next);
          setSaved(false);
        }}
        onSource={(id) => {
          setSourceId(id);
          setSaved(false);
        }}
      />
      <p className="text-xs text-[var(--text-muted)] break-words">
        Never overwrites a pick you already made. Copy-from uses that member’s
        team 30 minutes before lock (Week 1: that pick’s kickoff) and does{" "}
        <strong>not</strong> stamp 💩. Ranked uses the same{" "}
        <strong>2025 rank #N</strong> list as Pick (1 = strongest), skipping
        used and bye teams, from 2 minutes before week lock — each use stamps 💩
        and you cannot win the pool officially.
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
