"use client";

import {
  PICK_BACKUP_OFF,
  PICK_BACKUP_RANKED,
  type PickBackupMode,
} from "@/lib/pick-mirror";
import { BackupRadioRow } from "./BackupRadioRow";

type Props = {
  membershipId: string;
  mode: PickBackupMode;
  busy: boolean;
  saveAsAdmin?: boolean;
  onMode: (mode: PickBackupMode) => void;
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
        checked={p.mode === PICK_BACKUP_RANKED}
        disabled={p.busy}
        testId={test("backup-ranked")}
        onChange={() => p.onMode(PICK_BACKUP_RANKED)}
      >
        Ranked auto — best remaining <strong>2025 rank</strong> if no pick
        within about 5 min (💩)
      </BackupRadioRow>
    </fieldset>
  );
}
