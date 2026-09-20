"use client";

import { ShareLinkButton } from "@/components/ShareLinkButton";
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
  return (
    <ShareLinkButton
      testId="game-sheet-share"
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gold-400 hover:bg-gold-400/10 active:bg-gold-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60 touch-manipulation"
      getShare={() => ({
        url: matchupShareHref(window.location.origin, gameId, weekNumber),
        title: matchupShareTitle(awayAbbr, homeAbbr),
      })}
    />
  );
}
