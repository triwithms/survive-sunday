"use client";

import { useState } from "react";
import { Share } from "lucide-react";
import { ShareLinkPanel } from "@/components/ShareLinkPanel";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  shareCurrentPage,
} from "@/lib/page-share";

type Payload = { url: string; title: string; notice?: string };

/** Header + game-sheet Share: Web Share when available, plus a URL panel. */
export function ShareLinkButton({
  getShare,
  testId,
  className,
}: {
  getShare: () => { url: string; title: string };
  testId: string;
  className: string;
}) {
  const [open, setOpen] = useState<Payload | null>(null);

  async function onShare() {
    const payload = getShare();
    setOpen(payload);
    const result = await shareCurrentPage(payload);
    if (result === "copied") {
      setOpen({ ...payload, notice: PAGE_SHARE_COPIED });
    }
    if (result === "failed") {
      setOpen({ ...payload, notice: PAGE_SHARE_FAILED });
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Share"
        title="Share"
        data-testid={testId}
        className={className}
        onClick={() => void onShare()}
      >
        <Share className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <ShareLinkPanel
          url={open.url}
          title={open.title}
          notice={open.notice}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
