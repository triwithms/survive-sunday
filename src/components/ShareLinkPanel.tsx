"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  canUseWebShare,
  copyText,
  shareCurrentPage,
} from "@/lib/page-share";

/** Temporary share sheet: full URL for Home Screen (no address bar). */
export function ShareLinkPanel({
  url,
  title,
  notice,
  onClose,
}: {
  url: string;
  title: string;
  notice?: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const [copied, setCopied] = useState("");
  const status = copied || notice || "";
  const canSend = canUseWebShare({ title, text: title, url });

  async function onCopy() {
    setCopied((await copyText(url)) ? PAGE_SHARE_COPIED : PAGE_SHARE_FAILED);
  }

  async function onSend() {
    const result = await shareCurrentPage({ url, title });
    if (result === "copied") setCopied(PAGE_SHARE_COPIED);
    if (result === "failed") setCopied(PAGE_SHARE_FAILED);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="share-link-panel"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card-glass w-full max-w-sheet space-y-3 rounded-t-2xl p-5 sm:rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg tracking-wide text-gold-400">
            Share
          </h2>
          <button type="button" className="min-h-11 px-2 text-sm text-gold-400" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Home Screen has no address bar — this is the link.
        </p>
        <p data-testid="share-link-url" className="select-all break-all rounded-md bg-[var(--stadium-700)] px-3 py-2 font-mono text-xs">
          {url}
        </p>
        {status ? (
          <p role="status" aria-live="polite" data-testid="share-link-toast" className="text-xs text-field-400">
            {status}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button type="button" data-testid="share-link-copy" className="btn-secondary min-h-11 flex-1" onClick={() => void onCopy()}>
            Copy
          </button>
          {canSend ? (
            <button type="button" data-testid="share-link-send" className="btn-primary min-h-11 flex-1" onClick={() => void onSend()}>
              Send
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
