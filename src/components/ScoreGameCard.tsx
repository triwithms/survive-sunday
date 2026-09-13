"use client";

import Link from "next/link";
import { useState } from "react";
import { TeamLogo } from "@/components/TeamLogo";
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
      <TeamLogo abbr={abbr} logoUrl={logoUrl} size={28} />
      <span
        className={`font-mono text-sm font-semibold ${
          leading ? "text-field-400" : "text-[var(--text-primary)]"
        }`}
      >
        {abbr}
      </span>
      {hasBall ? (
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full bg-gold-400"
          title="Has the ball"
          aria-hidden
        />
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
    <div className="shrink-0 min-w-[6.5rem] max-w-[42%] text-center rounded-md bg-[var(--stadium-700)] px-2 py-1.5">
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
    </div>
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
      ? [bug.down, bug.periodLine, bug.spot].filter(Boolean).join(", ") ||
        status.primary
      : `${status.primary}${status.secondary ? `, ${status.secondary}` : ""}`
  }`;

  return (
    <li
      className={`card-glass p-3 ${isLive ? "border border-field-400/50" : ""}`}
    >
      <div
        role="button"
        tabIndex={0}
        className="cursor-pointer"
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
        {isLive && bug ? (
          <LiveScorebugStrip
            down={bug.down}
            periodLine={bug.periodLine}
            spot={bug.spot}
          />
        ) : status.kind === "final" ? (
          <div className="shrink-0 text-right pl-1">
            <span className="chip chip-gold">{status.primary}</span>
            {status.secondary ? (
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                {status.secondary}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="shrink-0 text-right pl-1">
            <p className="whitespace-nowrap text-sm font-medium leading-snug text-[var(--text-primary)]">
              {status.primary}
            </p>
            {status.secondary ? (
              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                {status.secondary}
              </p>
            ) : null}
          </div>
        )}
      </div>
      </div>
      {open ? (
        <ScoreGameDetailSheet game={game} onClose={() => setOpen(false)} />
      ) : null}
    </li>
  );
}
