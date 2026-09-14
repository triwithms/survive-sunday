"use client";

import { useState } from "react";
import {
  personalSeatJoinUrl,
  personalWhoJoinUrl,
  shareOrigin,
} from "@/lib/invite-link";

function CopyRow({
  label,
  url,
  testId,
}: {
  label: string;
  url: string;
  testId: string;
}) {
  const [copied, setCopied] = useState(false);

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
    <div className="space-y-1">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code
          className="text-[11px] break-all text-[var(--text-primary)] flex-1 min-w-0"
          data-testid={testId}
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
    </div>
  );
}

export function InviteLinkCopy({
  membershipId,
  nickname,
  claimed,
}: {
  membershipId: string;
  nickname: string;
  claimed: boolean;
}) {
  const origin = shareOrigin();
  const seatUrl = personalSeatJoinUrl(origin, membershipId);
  const whoUrl = personalWhoJoinUrl(origin, nickname);

  if (claimed) {
    return (
      <p className="text-xs text-[var(--text-muted)]" data-testid="invite-claimed">
        Already joined — they should Sign in, not use a Join link.
      </p>
    );
  }

  return (
    <div className="space-y-3" data-testid="invite-links">
      <p className="text-xs text-[var(--text-muted)]">
        Personal Join link for <strong className="text-[var(--text-primary)]">{nickname}</strong>.
        Opens Join with their name already picked. Invite code{" "}
        <span className="font-mono">SUNDAY26</span> is filled in.
      </p>
      <CopyRow label="Stable link (use this)" url={seatUrl} testId="invite-seat-url" />
      {whoUrl !== seatUrl && (
        <CopyRow
          label="Friendly nickname link (same seat)"
          url={whoUrl}
          testId="invite-who-url"
        />
      )}
    </div>
  );
}
