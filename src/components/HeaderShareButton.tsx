"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share } from "lucide-react";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  pageShareTitle,
  shareCurrentPage,
  shouldShowHeaderShare,
} from "@/lib/page-share";

export function HeaderShareButton() {
  const path = usePathname();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  if (!shouldShowHeaderShare(path)) return null;

  async function onShare() {
    const result = await shareCurrentPage({
      url: window.location.href,
      title: pageShareTitle(path),
    });
    if (result === "copied") setToast(PAGE_SHARE_COPIED);
    if (result === "failed") setToast(PAGE_SHARE_FAILED);
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Share"
        title="Share"
        data-testid="header-share"
        className="shrink-0 inline-flex items-center justify-center min-h-11 min-w-11 rounded-full border border-stadium-border text-gold-400 hover:border-gold-400/60 touch-manipulation"
        onClick={() => void onShare()}
      >
        <Share className="h-5 w-5" aria-hidden />
      </button>
      {toast ? (
        <p
          role="status"
          aria-live="polite"
          data-testid="header-share-toast"
          className="absolute right-0 top-full z-10 mt-1 w-max max-w-[11rem] rounded-md bg-stadium-800 px-2 py-1 text-xs text-field-400 shadow-lg"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
