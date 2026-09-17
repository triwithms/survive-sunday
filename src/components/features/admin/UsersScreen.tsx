import { AdminRolesPanel } from "@/components/AdminRolesPanel";
import { RosterEditor } from "@/components/RosterEditor";
import { SetMemberPasswordForm } from "@/components/SetMemberPasswordForm";
import { AdminHeading } from "./AdminHeading";
import { AdminRemovePlayer } from "./AdminRemovePlayer";
import type { UsersScreenProps } from "./types";

export function UsersScreen(props: UsersScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Users">
        Roster, who has Joined, temporary passwords, and who can open Admin.
        Pick backup is on each roster card.
      </AdminHeading>
      <SetMemberPasswordForm members={props.passwordMembers} />
      <AdminRolesPanel
        members={props.roleMembers}
        canDemoteMembershipIds={props.canDemoteMembershipIds}
      />
      <RosterEditor
        members={props.rosterMembers}
        mirrorOptions={props.mirrorOptions}
      />
      <AdminRemovePlayer members={props.removeMembers} />
    </div>
  );
}
