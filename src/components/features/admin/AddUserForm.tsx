"use client";

import { Card } from "@/components/ui";
import { AddUserFields } from "./AddUserFields";
import { AddUserSavedCard } from "./AddUserSaved";
import { useAddUser } from "./use-add-user";

export function AddUserForm() {
  const f = useAddUser();
  return (
    <Card as="section" className="p-4 space-y-3 min-w-0" data-testid="add-user">
      <div>
        <h2 className="font-semibold">Add user</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Fill whatever you know. Invite + a password you can text is enough —
          Welcome asks for the rest later. We do not email the password.
        </p>
      </div>
      {f.saved ? (
        <AddUserSavedCard saved={f.saved} kind={f.draft.kind} onAnother={f.reset} />
      ) : (
        <AddUserFields
          draft={f.draft}
          busy={f.busy}
          err={f.err}
          onChange={f.patch}
          onSuggest={f.suggest}
          onSubmit={(e) => void f.submit(e)}
        />
      )}
    </Card>
  );
}
