import { AdminHeading } from "./AdminHeading";
import { AddUserForm } from "./AddUserForm";
import { RosterEditor } from "./RosterEditor";
import type { UsersScreenProps } from "./types";

export function UsersScreen(props: UsersScreenProps & { openMemberId?: string | null }) {
  return (
    <div className="space-y-4">
      <AdminHeading title="Players">
        Add a friend, or tap someone to edit nickname, full name, email, or
        cell, set a password you can text, or copy their join link.
      </AdminHeading>
      <AddUserForm />
      <RosterEditor
        members={props.rosterMembers}
        enterPick={props.enterPick}
        openMemberId={props.openMemberId ?? null}
      />
    </div>
  );
}
