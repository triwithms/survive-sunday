"use client";

import { useState } from "react";
import { issueInviteToken } from "@/app/actions/issue-invite-token";
import { shareOrCopy } from "./copy-join";

type Props = {
  membershipId: string;
  nickname: string;
  /** Full-width label inside the record. The row uses a compact label. */
  block?: boolean;
};

export function InviteJoinButtons({ membershipId, nickname, block }: Props) {
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
    <div className={block ? "relative" : "relative shrink-0"}>
      <button
        type="button"
        className={
          block
            ? "min-h-11 w-full text-sm text-gold-400"
            : "min-h-11 max-w-[4.75rem] px-1 shrink-0 text-center text-[11px] leading-tight text-gold-400"
        }
        disabled={busy}
        aria-label={`Copy join link for ${nickname}`}
        data-testid={`invite-${membershipId}`}
        onClick={() => void invite()}
      >
        Copy join link
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
