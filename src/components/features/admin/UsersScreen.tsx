import { AdminHeading } from "./AdminHeading";
import { AdminRemovePlayer } from "./AdminRemovePlayer";
import { AdminRolesPanel } from "./AdminRolesPanel";
import { RosterEditor } from "./RosterEditor";
import type { UsersScreenProps } from "./types";

export function UsersScreen(props: UsersScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="Users">
        One row per friend. Tap a person on the roster to edit name, pick backup,
        or set a password you can text. Unclaimed rows have Invite and Copy Join.
      </AdminHeading>
      <RosterEditor
        members={props.rosterMembers}
        mirrorOptions={props.mirrorOptions}
      />
      <AdminRolesPanel
        members={props.roleMembers}
        canDemoteMembershipIds={props.canDemoteMembershipIds}
      />
      <AdminRemovePlayer members={props.removeMembers} />
    </div>
  );
}
