"use client";

import { RosterRow } from "./RosterRow";
import { UserEditPanel } from "./UserEditPanel";
import { useRosterEdit } from "./use-roster-edit";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
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

  return (
    <RosterRow
      member={member}
      open={p.open}
      onToggle={p.onToggle}
    >
      <UserEditPanel
        member={member}
        draft={edit.draft}
        disabled={p.disabled || p.busy}
        busy={p.busy}
        dirty={edit.dirty}
        onChange={edit.patch}
        onSave={() => void edit.save()}
      />
    </RosterRow>
  );
}
