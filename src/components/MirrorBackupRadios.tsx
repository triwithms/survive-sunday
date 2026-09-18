"use client";

import {
  PICK_BACKUP_MIRROR,
  PICK_BACKUP_OFF,
  PICK_BACKUP_RANKED,
  type PickBackupMode,
} from "@/lib/pick-mirror";
import { BackupRadioRow } from "./BackupRadioRow";

type MirrorOption = {
  id: string;
  nickname: string;
  label: string;
};

type Props = {
  membershipId: string;
  mode: PickBackupMode;
  sourceId: string;
  options: MirrorOption[];
  busy: boolean;
  saveAsAdmin?: boolean;
  onMode: (mode: PickBackupMode) => void;
  onSource: (id: string) => void;
};

export function MirrorBackupRadios(p: Props) {
  const name = `backup-${p.membershipId}`;
  const test = (id: string) => (p.saveAsAdmin ? undefined : id);
  return (
    <fieldset className="space-y-2 min-w-0 max-w-full">
      <legend className="text-sm text-[var(--text-muted)]">
        If you still have no pick when time is almost up
      </legend>
      <BackupRadioRow
        name={name}
        checked={p.mode === PICK_BACKUP_OFF}
        disabled={p.busy}
        testId={test("backup-off")}
        onChange={() => p.onMode(PICK_BACKUP_OFF)}
      >
        Off — I’ll pick myself
      </BackupRadioRow>
      <BackupRadioRow
        name={name}
        checked={p.mode === PICK_BACKUP_MIRROR}
        disabled={p.busy}
        testId={test("backup-mirror")}
        onChange={() => p.onMode(PICK_BACKUP_MIRROR)}
      >
        Copy from a pool member if no pick within 30 min
      </BackupRadioRow>
      {p.mode === PICK_BACKUP_MIRROR ? (
        <select
          value={p.sourceId}
          onChange={(e) => p.onSource(e.target.value)}
          disabled={p.busy}
          className="ml-7 w-[calc(100%-1.75rem)] max-w-full"
          aria-label="Mirror picks from"
          data-testid={
            p.saveAsAdmin
              ? `admin-mirror-${p.membershipId}`
              : "account-mirror-from"
          }
        >
          <option value="">Choose a player…</option>
          {p.options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}
      <BackupRadioRow
        name={name}
        checked={p.mode === PICK_BACKUP_RANKED}
        disabled={p.busy}
        testId={test("backup-ranked")}
        onChange={() => p.onMode(PICK_BACKUP_RANKED)}
      >
        Auto ranked — best remaining <strong>2025 rank</strong> if no pick
        within 2 min
      </BackupRadioRow>
    </fieldset>
  );
}
