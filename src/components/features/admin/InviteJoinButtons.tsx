"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { issueInviteToken } from "@/app/actions/issue-invite-token";
import { shareOrCopy } from "./copy-join";

type Props = {
  membershipId: string;
  nickname: string;
};

export function InviteJoinButtons({ membershipId, nickname }: Props) {
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function invite() {
    setBusy(true);
    const result = await issueInviteToken(membershipId);
    setBusy(false);
    if (!result.ok) {
      flash(result.error);
      return;
    }
    const ok = await shareOrCopy(result.url, `Survive Sunday for ${nickname}`);
    flash(ok ? "Copied invite link" : "Couldn’t copy — try again");
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        className="min-h-11 min-w-11 inline-flex items-center justify-center text-gold-400"
        disabled={busy}
        aria-label={`Invite ${nickname}`}
        data-testid={`invite-${membershipId}`}
        onClick={() => void invite()}
      >
        <Share2 className="h-5 w-5" aria-hidden />
      </button>
      {toast ? (
        <p
          role="status"
          aria-live="polite"
          className="absolute right-0 top-full z-10 w-max max-w-[11rem] text-xs text-field-400"
          data-testid="copy-toast"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
