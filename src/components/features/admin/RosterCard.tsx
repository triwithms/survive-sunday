"use client";

import { resolvePickBackupMode } from "@/lib/pick-mirror";
import { RosterRow } from "./RosterRow";
import { UserEditPanel } from "./UserEditPanel";
import { useRosterEdit } from "./use-roster-edit";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

type Props = {
  member: RosterMember;
  rosterNicknames: string[];
  mirrorOptions: RosterMirrorOption[];
  open: boolean;
  onToggle: () => void;
  disabled: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onMsg: (msg: string) => void;
  onErr: (err: string) => void;
};

export function RosterCard(p: Props) {
  const { member } = p;
  const edit = useRosterEdit(member, p.onBusy, p.onMsg, p.onErr);
  const initialMode = resolvePickBackupMode(
    member.pickBackup,
    member.mirrorFromMembershipId
  );
  const sourceNick = p.mirrorOptions.find(
    (o) => o.id === member.mirrorFromMembershipId
  )?.nickname;

  return (
    <RosterRow
      member={member}
      open={p.open}
      onToggle={p.onToggle}
      backupSourceNickname={sourceNick}
      rosterNicknames={p.rosterNicknames}
    >
      <UserEditPanel
        member={member}
        draft={edit.draft}
        disabled={p.disabled || p.busy}
        busy={p.busy}
        dirty={edit.dirty}
        initialMode={initialMode}
        mirrorOptions={p.mirrorOptions}
        onChange={edit.patch}
        onSave={() => void edit.save()}
      />
    </RosterRow>
  );
}
