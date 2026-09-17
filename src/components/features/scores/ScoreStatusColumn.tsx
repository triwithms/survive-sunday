import type { ReactNode } from "react";
import { Chip } from "@/components/ui";
import {
  formatLiveScorebug,
  formatScoresStatus,
  isLiveGame,
} from "@/lib/game-display";
import { GameDetailsHint } from "./GameDetailsHint";
import type { ScoreGameCardGame } from "./types";

function StatusWell({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-[6.5rem] text-center rounded-md bg-[var(--stadium-700)] px-2 py-1.5">
      {children}
    </div>
  );
}

function LiveScorebugStrip({
  down,
  periodLine,
  spot,
}: {
  down: string | null;
  periodLine: string | null;
  spot: string | null;
}) {
  return (
    <StatusWell>
      {down ? (
        <p className="font-display text-[13px] sm:text-sm font-semibold uppercase tracking-wide leading-tight text-gold-400">
          {down}
        </p>
      ) : null}
      {periodLine ? (
        <p className="mt-0.5 font-mono text-xs tabular-nums text-[var(--text-primary)] whitespace-nowrap">
          {periodLine}
        </p>
      ) : (
        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-sky-400">
          LIVE
        </p>
      )}
      {spot ? (
        <p className="mt-0.5 text-[10px] font-medium text-[var(--text-muted)] whitespace-nowrap">
          {spot}
        </p>
      ) : null}
    </StatusWell>
  );
}

export function ScoreStatusColumn({ game }: { game: ScoreGameCardGame }) {
  const isLive = isLiveGame(game.status);
  const status = formatScoresStatus(game);
  const bug = isLive ? formatLiveScorebug(game.note) : null;

  return (
    <div
      className={`shrink-0 flex flex-col items-end pl-1 ${
        isLive && bug ? "max-w-[42%]" : ""
      }`}
    >
      {isLive && bug ? (
        <LiveScorebugStrip
          down={bug.down}
          periodLine={bug.periodLine}
          spot={bug.spot}
        />
      ) : status.kind === "final" ? (
        <StatusWell>
          <Chip>{status.primary}</Chip>
          {status.secondary ? (
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              {status.secondary}
            </p>
          ) : null}
        </StatusWell>
      ) : (
        <StatusWell>
          <p className="whitespace-nowrap text-sm font-medium leading-snug text-[var(--text-primary)]">
            {status.primary}
          </p>
          {status.secondary ? (
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
              {status.secondary}
            </p>
          ) : null}
        </StatusWell>
      )}
      <GameDetailsHint />
    </div>
  );
}
