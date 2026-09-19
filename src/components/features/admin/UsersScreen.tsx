import { AdminHeading } from "./AdminHeading";
import { RosterEditor } from "./RosterEditor";
import type { UsersScreenProps } from "./types";

export function UsersScreen(props: UsersScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Users">
        Find a friend. Tap them to set a password you can text, or copy a Join
        link. We do not email the password.
      </AdminHeading>
      <RosterEditor
        members={props.rosterMembers}
        mirrorOptions={props.mirrorOptions}
      />
    </div>
  );
}
