"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { ScoreGameDetailSheet } from "@/components/ScoreGameDetailSheet";
import { isLiveGame } from "@/lib/game-display";
import { ScoreTeamRow } from "./ScoreTeamRow";
import { ScoreStatusColumn } from "./ScoreStatusColumn";
import { scoreGameMeta } from "./score-game-meta";
import type { ScoreGameCardGame } from "./types";

export type { ScoreGameCardGame };

export function ScoreGameCard({
  game,
  weekNumber,
  startOpen = false,
}: {
  game: ScoreGameCardGame;
  weekNumber: number;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const isLive = isLiveGame(game.status);
  const meta = scoreGameMeta(game);

  return (
    <Card
      as="li"
      className={`p-3 ${isLive ? "border border-field-400/50" : ""}`}
      data-share-chunk=""
      data-share-game=""
      data-game-status={game.status}
    >
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer rounded-md -m-1 p-1 hover:bg-gold-400/[0.04] active:bg-gold-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
        aria-haspopup="dialog"
        aria-label={`${meta.aria}. Open game details`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <ScoreTeamRow
              abbr={game.awayAbbr}
              logoUrl={game.awayLogoUrl}
              score={game.scoreAway}
              leading={meta.awayLead}
              live={isLive}
              hasBall={meta.hasBall === game.awayAbbr}
            />
            <ScoreTeamRow
              abbr={game.homeAbbr}
              logoUrl={game.homeLogoUrl}
              score={game.scoreHome}
              leading={meta.homeLead}
              live={isLive}
              hasBall={meta.hasBall === game.homeAbbr}
            />
          </div>
          <ScoreStatusColumn game={game} />
        </div>
      </div>
      {open ? (
        <ScoreGameDetailSheet
          game={game}
          weekNumber={weekNumber}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Card>
  );
}
