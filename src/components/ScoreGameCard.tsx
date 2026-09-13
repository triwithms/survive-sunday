import Link from "next/link";
import { TeamLogo } from "@/components/TeamLogo";
import {
  formatScoresStatus,
  isFinalGame,
  isLiveGame,
  possessionAbbrFromSituation,
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
      className="flex items-center gap-2 min-h-11 min-w-0 rounded-md px-0.5 -mx-0.5 hover:bg-gold-400/5 active:bg-gold-400/10"
      aria-label={`Team details for ${abbr}${hasBall ? ", has the ball" : ""}`}
    >
      <TeamLogo abbr={abbr} logoUrl={logoUrl} size={28} />
      <span
        className={`font-mono text-sm font-semibold ${
          leading ? "text-field-400" : "text-[var(--text-primary)]"
        }`}
      >
        {abbr}
        {hasBall ? (
          <span
            className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-sky-400"
            aria-hidden
          >
            ●
          </span>
        ) : null}
      </span>
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

/** One Scores row: logos + scores, with ESPN quarter/clock beside live games. */
export function ScoreGameCard({ game }: { game: ScoreGameCardGame }) {
  const isLive = isLiveGame(game.status);
  const isFinal = isFinalGame(game.status);
  const status = formatScoresStatus(game);
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

  const hasBall = possessionAbbrFromSituation(status.situation);
  const aria = `${game.awayAbbr} ${game.scoreAway ?? "–"} at ${game.homeAbbr} ${
    game.scoreHome ?? "–"
  }, ${status.primary}${status.secondary ? `, ${status.secondary}` : ""}${
    status.situation ? `, ${status.situation}` : ""
  }`;

  return (
    <li
      className={`card-glass p-3 ${isLive ? "border border-field-400/50" : ""}`}
      aria-label={aria}
    >
      <div className="flex items-center gap-3">
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
        <div className="shrink-0 text-right pl-1">
          {status.kind === "live" ? (
            <div>
              <p className="whitespace-nowrap font-mono text-sm sm:text-base font-semibold leading-tight text-sky-400 tabular-nums">
                {status.primary}
              </p>
              {status.secondary ? (
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-400">
                  {status.secondary}
                </p>
              ) : null}
            </div>
          ) : status.kind === "final" ? (
            <div>
              <span className="chip chip-gold">{status.primary}</span>
              {status.secondary ? (
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {status.secondary}
                </p>
              ) : null}
            </div>
          ) : (
            <div>
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
      {status.kind === "live" && status.situation ? (
        <p className="mt-1.5 text-xs leading-snug text-[var(--text-primary)]">
          {status.situation}
        </p>
      ) : null}
    </li>
  );
}
