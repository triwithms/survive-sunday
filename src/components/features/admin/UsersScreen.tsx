import { AdminHeading } from "./AdminHeading";
import { AddUserForm } from "./AddUserForm";
import { RosterEditor } from "./RosterEditor";
import type { UsersScreenProps } from "./types";

export function UsersScreen(props: UsersScreenProps) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Users">
        Add a friend, or tap someone to edit nickname, full name, email, or
        cell, set a password you can text, or tap the invite icon.
      </AdminHeading>
      <AddUserForm />
      <RosterEditor members={props.rosterMembers} />
    </div>
  );
}
