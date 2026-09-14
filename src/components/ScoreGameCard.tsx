"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { ScoreGameDetailSheet } from "@/components/ScoreGameDetailSheet";
import {
  formatLiveScorebug,
  formatScoresStatus,
  isFinalGame,
  isLiveGame,
} from "@/lib/game-display";

export type ScoreGameCardGame = {
  id: string;
  awayAbbr: string;
  homeAbbr: string;
  scoreAway: number | null;
  scoreHome: number | null;
  status: string;
  note: string | null;
  kickoff: Date | string;
  network: string | null;
  awayLogoUrl: string | null;
  homeLogoUrl: string | null;
};

function ScoreTeamRow({
  abbr,
  logoUrl,
  score,
  leading,
  live,
  hasBall,
}: {
  abbr: string;
  logoUrl: string | null;
  score: number | null;
  leading: boolean;
  live: boolean;
  hasBall: boolean;
}) {
  return (
    <Link
      href={`/team/${abbr}`}
      prefetch={false}
      className={`relative z-10 flex items-center gap-2 min-h-11 min-w-0 rounded-md px-1.5 -mx-0.5 hover:bg-gold-400/5 active:bg-gold-400/10 ${
        hasBall ? "border-l-[3px] border-gold-400 bg-gold-400/5" : "border-l-[3px] border-transparent"
      }`}
      aria-label={`Team details for ${abbr}${hasBall ? ", has the ball" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <TeamLogo abbr={abbr} logoUrl={logoUrl} size={TEAM_LOGO_SIZE.compact} />
      <span
        className={`font-mono text-sm font-semibold ${
          leading ? "text-field-400" : "text-[var(--text-primary)]"
        }`}
      >
        {abbr}
      </span>
      {hasBall ? (
        <span
          className="shrink-0 text-[13px] leading-none"
          title="Has the ball"
          aria-hidden
        >
          🏈
        </span>
      ) : null}
      <span
        className={`ml-auto w-9 text-right font-mono text-xl tabular-nums ${
          live && score != null ? "text-gold-400" : ""
        } ${leading ? "font-semibold" : ""}`}
      >
        {score != null ? score : "–"}
      </span>
    </Link>
  );
}

/** Dark status well — live scorebug, Final chip, or kickoff. Details sits under it. */
function StatusWell({ children }: { children: React.ReactNode }) {
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

/** Compact disclosure under the status / scorebug — does not sit inside the TV strip. */
function GameDetailsHint() {
  return (
    <span
      className="mt-1 inline-flex items-center justify-end gap-0.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide text-gold-400"
      aria-hidden
      data-testid="game-details-hint"
    >
      Details
      <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2.5} />
    </span>
  );
}

/** One Scores row: logos + scores; live games use a TV-style status strip. */
export function ScoreGameCard({ game }: { game: ScoreGameCardGame }) {
  const [open, setOpen] = useState(false);
  const isLive = isLiveGame(game.status);
  const isFinal = isFinalGame(game.status);
  const status = formatScoresStatus(game);
  const bug = isLive ? formatLiveScorebug(game.note) : null;
  const awayLead =
    (isFinal &&
      game.scoreAway != null &&
      game.scoreHome != null &&
      game.scoreAway > game.scoreHome) ||
    (isLive && (game.scoreAway ?? 0) > (game.scoreHome ?? 0));
  const homeLead =
    (isFinal &&
      game.scoreAway != null &&
      game.scoreHome != null &&
      game.scoreHome > game.scoreAway) ||
    (isLive && (game.scoreHome ?? 0) > (game.scoreAway ?? 0));

  const hasBall = bug?.possession ?? null;
  const aria = `${game.awayAbbr} ${game.scoreAway ?? "–"} at ${game.homeAbbr} ${
    game.scoreHome ?? "–"
  }, ${
    bug
      ? [
          hasBall ? `${hasBall} has the ball` : null,
          bug.down,
          bug.periodLine,
          bug.spot,
        ]
          .filter(Boolean)
          .join(", ") || status.primary
      : `${status.primary}${status.secondary ? `, ${status.secondary}` : ""}`
  }`;

  return (
    <li
      className={`card-glass p-3 ${isLive ? "border border-field-400/50" : ""}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer rounded-md -m-1 p-1 hover:bg-gold-400/[0.04] active:bg-gold-400/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60"
        aria-haspopup="dialog"
        aria-label={`${aria}. Open game details`}
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
            leading={awayLead}
            live={isLive}
            hasBall={hasBall === game.awayAbbr}
          />
          <ScoreTeamRow
            abbr={game.homeAbbr}
            logoUrl={game.homeLogoUrl}
            score={game.scoreHome}
            leading={homeLead}
            live={isLive}
            hasBall={hasBall === game.homeAbbr}
          />
        </div>
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
              <span className="chip chip-gold">{status.primary}</span>
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
      </div>
      </div>
      {open ? (
        <ScoreGameDetailSheet game={game} onClose={() => setOpen(false)} />
      ) : null}
    </li>
  );
}
