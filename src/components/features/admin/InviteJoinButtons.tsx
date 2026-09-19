"use client";

import { useState } from "react";
import { issueInviteToken } from "@/app/actions/issue-invite-token";
import { Button } from "@/components/ui";
import { copyText, memberCopyJoinUrl } from "./copy-join";

type Props = {
  membershipId: string;
  nickname: string;
  rosterNicknames: string[];
};

export function InviteJoinButtons({
  membershipId,
  nickname,
  rosterNicknames,
}: Props) {
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function copyJoin() {
    const url = memberCopyJoinUrl(membershipId, nickname, rosterNicknames);
    flash((await copyText(url)) ? "Copied Join link" : "Couldn’t copy — try again");
  }

  async function invite() {
    setBusy(true);
    const result = await issueInviteToken(membershipId);
    setBusy(false);
    if (!result.ok) {
      flash(result.error);
      return;
    }
    const ok = await copyText(result.url);
    flash(ok ? "Copied invite link" : "Couldn’t copy — try again");
  }

  return (
    <div className="grid grid-cols-2 gap-2 min-w-0">
      <Button
        variant="secondary"
        className="min-h-11 w-full px-2 text-sm"
        disabled={busy}
        data-testid={`invite-${membershipId}`}
        onClick={() => void invite()}
      >
        {busy ? "Inviting…" : "Invite"}
      </Button>
      <Button
        variant="secondary"
        className="min-h-11 w-full px-2 text-sm"
        disabled={busy}
        data-testid={`copy-join-${membershipId}`}
        onClick={() => void copyJoin()}
      >
        Copy Join
      </Button>
      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className="col-span-2 text-sm text-field-400"
          data-testid="copy-toast"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
