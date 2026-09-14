"use client";

import { useState } from "react";
import { personalInviteUrl, shareOrigin } from "@/lib/invite-link";

export function InviteLinkCopy({
  membershipId,
  nickname,
  claimed,
  rosterNicknames,
}: {
  membershipId: string;
  nickname: string;
  claimed: boolean;
  rosterNicknames: string[];
}) {
  const origin = shareOrigin();
  const url = personalInviteUrl(
    origin,
    { membershipId, nickname },
    rosterNicknames.map((n) => ({ nickname: n }))
  );
  const [copied, setCopied] = useState(false);

  if (claimed) {
    return (
      <p className="text-xs text-[var(--text-muted)]" data-testid="invite-claimed">
        Already joined
      </p>
    );
  }

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="invite-links">
      <code
        className="text-[11px] break-all text-[var(--text-primary)] flex-1 min-w-0"
        data-testid="invite-url"
      >
        {url}
      </code>
      <button
        type="button"
        className="btn-secondary text-xs px-3 py-1 shrink-0"
        onClick={() => void copy()}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
