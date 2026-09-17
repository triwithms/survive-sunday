import { Card, Chip } from "@/components/ui";
import { formatKickoff } from "@/lib/utils";
import { formatMatchupListLine } from "@/lib/game-display";
import { matchupFavourite } from "./pick-format";
import { PickSideButton } from "./PickSideButton";
import type { PickMatchup, PickSide } from "./types";

export function PickMatchupCard({
  matchup,
  selectedAbbr,
  readOnly,
  gameClosed,
  onPick,
}: {
  matchup: PickMatchup;
  selectedAbbr: string | null;
  readOnly: boolean;
  gameClosed: boolean;
  onPick: (side: PickSide) => void;
}) {
  const fav = matchupFavourite(matchup);

  return (
    <Card as="li" className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--stadium-border)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono">
            {formatMatchupListLine(matchup) || formatKickoff(matchup.kickoff)}
          </span>
          {fav && (
            <span className="text-[var(--text-primary)]">{fav.label}</span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {matchup.status === "live" && (
            <Chip tone="live" className="text-[10px]">
              LIVE
            </Chip>
          )}
          {gameClosed && matchup.status !== "live" && (
            <span className="text-[10px] uppercase tracking-wide">Started</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 p-2 sm:gap-2 sm:p-3">
        <PickSideButton
          side={matchup.away}
          selected={selectedAbbr === matchup.away.abbr}
          readOnly={readOnly || gameClosed}
          gameClosed={gameClosed}
          align="away"
          onPick={() => onPick(matchup.away)}
        />
        <div className="flex flex-col items-center justify-center gap-1 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            vs
          </span>
        </div>
        <PickSideButton
          side={matchup.home}
          selected={selectedAbbr === matchup.home.abbr}
          readOnly={readOnly || gameClosed}
          gameClosed={gameClosed}
          align="home"
          onPick={() => onPick(matchup.home)}
        />
      </div>
    </Card>
  );
}
