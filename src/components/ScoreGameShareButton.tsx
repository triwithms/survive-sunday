"use client";

import { useEffect, useState } from "react";
import { Share } from "lucide-react";
import {
  PAGE_SHARE_COPIED,
  PAGE_SHARE_FAILED,
  shareCurrentPage,
} from "@/lib/page-share";
import { matchupShareHref, matchupShareTitle } from "@/lib/matchup-share";

export function ScoreGameShareButton({
  gameId,
  weekNumber,
  awayAbbr,
  homeAbbr,
}: {
  gameId: string;
  weekNumber: number;
  awayAbbr: string;
  homeAbbr: string;
}) {
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function onShare() {
    const result = await shareCurrentPage({
      url: matchupShareHref(window.location.origin, gameId, weekNumber),
      title: matchupShareTitle(awayAbbr, homeAbbr),
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
        data-testid="game-sheet-share"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 touch-manipulation"
        onClick={() => void onShare()}
      >
        <Share className="h-5 w-5" aria-hidden />
      </button>
      {toast ? (
        <p
          role="status"
          aria-live="polite"
          data-testid="game-sheet-share-toast"
          className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[110] w-max max-w-[11rem] -translate-x-1/2 rounded-md bg-stadium-800 px-3 py-1.5 text-xs text-field-400 shadow-lg"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
