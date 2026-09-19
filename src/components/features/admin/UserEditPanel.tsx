"use client";

import { MirrorPicksForm } from "@/components/MirrorPicksForm";
import { Button } from "@/components/ui";
import { isSeatClaimed } from "@/lib/claim-seat";
import type { PickBackupMode } from "@/lib/pick-mirror";
import { AdminDetails } from "./AdminDetails";
import { rosterToPasswordMember } from "./password-members";
import { RemoveSeatButton } from "./RemoveSeatButton";
import { RosterCardFields } from "./RosterCardFields";
import { SetMemberPasswordForm } from "./SetMemberPasswordForm";
import type { RosterMember, RosterMirrorOption } from "./roster-types";

type Props = {
  member: RosterMember;
  nickname: string;
  realName: string;
  disabled: boolean;
  busy: boolean;
  dirty: boolean;
  initialMode: PickBackupMode;
  mirrorOptions: RosterMirrorOption[];
  onNickname: (value: string) => void;
  onRealName: (value: string) => void;
  onSave: () => void;
};

export function UserEditPanel(p: Props) {
  const { member } = p;
  const claimed = isSeatClaimed(member.email);
  const player = member.role !== "admin";
  return (
    <>
      {member.email ? (
        <p className="text-xs text-[var(--text-muted)] break-all">{member.email}</p>
      ) : null}
      <RosterCardFields
        nickname={p.nickname}
        realName={p.realName}
        disabled={p.disabled}
        onNickname={p.onNickname}
        onRealName={p.onRealName}
      />
      <Button className="w-full min-h-11" disabled={p.disabled || !p.dirty} onClick={p.onSave}>
        {p.busy ? "Saving…" : "Save this person"}
      </Button>
      {claimed && player ? (
        <SetMemberPasswordForm
          members={[rosterToPasswordMember(member)]}
          embedded
        />
      ) : null}
      {player ? (
        <MirrorPicksForm
          membershipId={member.id}
          initialMode={p.initialMode}
          initialSourceId={member.mirrorFromMembershipId}
          options={p.mirrorOptions}
          saveAsAdmin
        />
      ) : null}
      {player ? (
        <AdminDetails title={`Remove ${member.nickname}`} danger>
          <RemoveSeatButton membershipId={member.id} nickname={member.nickname} />
        </AdminDetails>
      ) : null}
    </>
  );
}
