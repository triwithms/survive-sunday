"use client";

import { Button } from "@/components/ui";
import { isSeatClaimed } from "@/lib/claim-seat";
import { AdminDetails } from "./AdminDetails";
import { rosterToPasswordMember } from "./password-members";
import { RemoveSeatButton } from "./RemoveSeatButton";
import { RosterCardFields } from "./RosterCardFields";
import { RosterContactFields } from "./RosterContactFields";
import { RosterNotifySoon } from "./RosterNotifySoon";
import { SetMemberPasswordForm } from "./SetMemberPasswordForm";
import type { RosterDraft } from "./use-roster-edit";
import type { RosterMember } from "./roster-types";

type Props = {
  member: RosterMember;
  draft: RosterDraft;
  disabled: boolean;
  busy: boolean;
  dirty: boolean;
  onChange: (patch: Partial<RosterDraft>) => void;
  onSave: () => void;
};

export function UserEditPanel(p: Props) {
  const { member, draft } = p;
  const claimed = isSeatClaimed(member.email);
  const player = member.role !== "admin";
  return (
    <>
      <RosterCardFields
        nickname={draft.nickname}
        realName={draft.realName}
        disabled={p.disabled}
        onNickname={(nickname) => p.onChange({ nickname })}
        onRealName={(realName) => p.onChange({ realName })}
      />
      <RosterContactFields
        email={draft.email}
        phone={draft.phone}
        disabled={p.disabled}
        onEmail={(email) => p.onChange({ email })}
        onPhone={(phone) => p.onChange({ phone })}
      />
      <Button
        className="w-full min-h-11"
        disabled={p.disabled || !p.dirty}
        onClick={p.onSave}
        data-testid="roster-save"
      >
        {p.busy ? "Saving…" : "Save this person"}
      </Button>
      <RosterNotifySoon />
      {claimed && player ? (
        <SetMemberPasswordForm
          members={[rosterToPasswordMember(member)]}
          embedded
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
