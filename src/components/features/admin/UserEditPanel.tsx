"use client";

import { Button } from "@/components/ui";
import { isSeatClaimed } from "@/lib/claim-seat";
import { AdminDetails } from "./AdminDetails";
import { InviteJoinButtons } from "./InviteJoinButtons";
import { rosterToPasswordMember } from "./password-members";
import { RemoveSeatButton } from "./RemoveSeatButton";
import { RosterCardFields } from "./RosterCardFields";
import { RosterContactFields } from "./RosterContactFields";
import { RosterNotifyPref } from "./RosterNotifyPref";
import { RosterRoleSection } from "./RosterRoleSection";
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
      <AdminDetails title="Contact" summary={member.nickname} testId="roster-contact">
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
      </AdminDetails>
      <AdminDetails
        title="Notifications"
        summary="Game notices and reminders"
        testId="roster-notifications"
      >
        <RosterNotifyPref userId={member.userId} initial={member.notifyPrefs} />
      </AdminDetails>
      <AdminDetails title="Access" summary="Copy join link · password" testId="roster-access">
        <InviteJoinButtons membershipId={member.id} nickname={member.nickname} block />
        {claimed && player ? (
          <SetMemberPasswordForm
            members={[rosterToPasswordMember(member)]}
            embedded
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Send the join link until they join with a real email.
          </p>
        )}
      </AdminDetails>
      {player ? <RosterRoleSection member={member} /> : null}
      {player ? (
        <AdminDetails title={`Remove ${member.nickname}`} danger>
          <RemoveSeatButton membershipId={member.id} nickname={member.nickname} />
        </AdminDetails>
      ) : null}
    </>
  );
}
