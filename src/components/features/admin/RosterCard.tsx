"use client";

import { memberWeekPick } from "./enter-pick-options";
import type { EnterPickData } from "./enter-pick-types";
import { MemberPickSection } from "./MemberPickSection";
import { RosterRecordBar } from "./RosterRecordBar";
import { RosterRow } from "./RosterRow";
import { UserEditPanel } from "./UserEditPanel";
import { useRosterEdit } from "./use-roster-edit";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  enterPick: EnterPickData;
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
  const weekPick = memberWeekPick(
    p.enterPick.members,
    member.id,
    p.enterPick.currentWeek
  );

  return (
    <RosterRow
      member={member}
      weekPick={weekPick}
      open={p.open}
      onToggle={p.onToggle}
    >
      <RosterRecordBar
        member={member}
        weekPick={weekPick}
        weekOpen={p.enterPick.currentWeekOpen === true}
      />
      <MemberPickSection member={member} data={p.enterPick} />
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
