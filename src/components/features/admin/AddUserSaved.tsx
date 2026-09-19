"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { copyText } from "./copy-join";
import { memberPasswordShareText } from "./password-members";
import type { AddUserSaved } from "./add-user-types";

export function AddUserSavedCard({
  saved,
  kind,
  onAnother,
}: {
  saved: AddUserSaved;
  kind: "temporary" | "permanent";
  onAnother: () => void;
}) {
  const [toast, setToast] = useState("");
  const share =
    saved.password && saved.claimed && saved.email
      ? memberPasswordShareText({
          email: saved.email,
          password: saved.password,
          kind,
        })
      : saved.password
        ? `Password: ${saved.password}`
        : null;

  async function copy(label: string, text: string) {
    setToast((await copyText(text)) ? `Copied ${label}` : "Couldn’t copy — try again");
  }

  return (
    <div className="space-y-3" data-testid="add-user-saved">
      <p className="text-sm text-field-400" role="status">
        Added {saved.nickname}
        {saved.realName ? ` (${saved.realName})` : ""}. Gaps can wait for Welcome.
      </p>
      <p className="text-xs text-[var(--text-muted)] break-all">
        {saved.email
          ? saved.claimed
            ? saved.email
            : "No real email yet — send the invite, they’ll add it."
          : "Needs email to log in"}
      </p>
      {saved.inviteUrl ? (
        <Button type="button" variant="secondary" className="w-full min-h-11"
          onClick={() => void copy("invite link", saved.inviteUrl!)}>
          Copy invite link
        </Button>
      ) : null}
      {share ? (
        <Button type="button" variant="secondary" className="w-full min-h-11"
          onClick={() => void copy("password", share)}>
          Copy password text
        </Button>
      ) : null}
      {toast ? <p className="text-sm text-field-400" role="status">{toast}</p> : null}
      <Button className="w-full min-h-11" onClick={onAnother}>Add another</Button>
    </div>
  );
}
