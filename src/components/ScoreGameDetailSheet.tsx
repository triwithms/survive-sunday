"use client";

import { useEffect, useId, useState } from "react";
import { ModalDialog } from "@/components/ModalDialog";
import { TeamLogo } from "@/components/TeamLogo";
import {
  formatKickoffForScores,
  formatLiveScorebug,
  formatScoresStatus,
  isLiveGame,
} from "@/lib/game-display";
import type { GameDetailDto } from "@/lib/espn-game-detail-parse";

type SheetGame = {
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

function TimeoutPips({ count }: { count: number | null }) {
  if (count == null) return <span className="text-[var(--text-muted)]">—</span>;
  const capped = Math.max(0, Math.min(3, count));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${capped} timeouts`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-3 rounded-sm ${
            i < capped ? "bg-gold-400" : "bg-[var(--stadium-border)]"
          }`}
        />
      ))}
    </span>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="text-xs text-[var(--text-muted)]">{children}</p>;
}

export function ScoreGameDetailSheet({
  game,
  onClose,
}: {
  game: SheetGame;
  onClose: () => void;
}) {
  const titleId = useId();
  const [data, setData] = useState<GameDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/scores/detail?gameId=${encodeURIComponent(game.id)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as GameDetailDto & { error?: string };
        if (!res.ok) throw new Error(json.error || "Couldn’t load ESPN details");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Couldn’t load ESPN details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [game.id]);

  const note = data?.note ?? game.note;
  const status = data?.status ?? game.status;
  const scoreAway = data?.scoreAway ?? game.scoreAway;
  const scoreHome = data?.scoreHome ?? game.scoreHome;
  const live = isLiveGame(status);
  const bug = live ? formatLiveScorebug(note) : null;
  const header = formatScoresStatus({
    status,
    scoreAway,
    scoreHome,
    note,
    kickoff: game.kickoff,
    network: game.network,
  });

  return (
    <ModalDialog labelledBy={titleId} placement="sheet" onBackdropClick={onClose}>
      <div className="flex items-start justify-between gap-3">
        <h2 id={titleId} className="font-display text-lg text-gold-400 tracking-wide">
          {game.awayAbbr} @ {game.homeAbbr}
        </h2>
        <button
          type="button"
          className="text-sm text-gold-400 min-h-11 px-2"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <TeamLogo abbr={game.awayAbbr} logoUrl={game.awayLogoUrl} size={28} />
          <span className="font-mono font-semibold">{game.awayAbbr}</span>
          <span className="font-mono text-xl tabular-nums">
            {scoreAway ?? "–"}
          </span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xl tabular-nums">
            {scoreHome ?? "–"}
          </span>
          <span className="font-mono font-semibold">{game.homeAbbr}</span>
          <TeamLogo abbr={game.homeAbbr} logoUrl={game.homeLogoUrl} size={28} />
        </div>
      </div>

      {live && bug ? (
        <div className="rounded-md bg-[var(--stadium-700)] px-3 py-2 text-center">
          {bug.down ? (
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-gold-400">
              {bug.down}
            </p>
          ) : null}
          <p className="font-mono text-sm tabular-nums">
            {bug.periodLine || "LIVE"}
          </p>
          {bug.spot ? (
            <p className="text-xs text-[var(--text-muted)]">{bug.spot}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          {header.kind === "final"
            ? header.primary
            : header.primary}
          {header.secondary ? ` · ${header.secondary}` : ""}
        </p>
      )}

      {loading ? (
        <Empty>Loading ESPN details…</Empty>
      ) : error ? (
        <p className="text-xs text-crimson-400">{error}</p>
      ) : (
        <>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-400 mb-1.5">
              Timeouts
            </h3>
            {data?.timeoutsAway == null && data?.timeoutsHome == null ? (
              <Empty>ESPN hasn’t published timeouts for this game yet.</Empty>
            ) : (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-mono">
                  {game.awayAbbr}
                  <TimeoutPips count={data?.timeoutsAway ?? null} />
                </span>
                <span className="flex items-center gap-2 font-mono">
                  <TimeoutPips count={data?.timeoutsHome ?? null} />
                  {game.homeAbbr}
                </span>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-400 mb-1.5">
              Scoring
            </h3>
            {!data?.scoringPlays.length ? (
              <Empty>No scoring plays from ESPN yet.</Empty>
            ) : (
              <ul className="space-y-2">
                {data.scoringPlays.map((p, i) => (
                  <li key={`${p.text}-${i}`} className="text-xs leading-snug">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-gold-400">
                        {p.teamAbbr} · {p.type}
                      </span>
                      <span className="text-[var(--text-muted)] shrink-0">
                        {[p.period, p.clock].filter(Boolean).join(" ")} ·{" "}
                        {p.awayScore}–{p.homeScore}
                      </span>
                    </div>
                    <p className="text-[var(--text-primary)]">{p.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-400 mb-1.5">
              Drives
            </h3>
            {!data?.currentDrive && !data?.recentDrives.length ? (
              <Empty>No drive summary from ESPN yet.</Empty>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {data?.currentDrive ? (
                  <li>
                    <span className="font-mono text-gold-400">
                      {data.currentDrive.teamAbbr}
                    </span>{" "}
                    {data.currentDrive.description}
                    {data.currentDrive.result
                      ? ` · ${data.currentDrive.result}`
                      : " · current"}
                  </li>
                ) : null}
                {data?.recentDrives.map((d, i) => (
                  <li key={`${d.description}-${i}`} className="text-[var(--text-muted)]">
                    <span className="font-mono text-[var(--text-primary)]">
                      {d.teamAbbr}
                    </span>{" "}
                    {d.description}
                    {d.result ? ` · ${d.result}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-400 mb-1.5">
              Leaders
            </h3>
            {!data?.leaders.length ? (
              <Empty>No player leaders from ESPN yet.</Empty>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {data.leaders.map((l, i) => (
                  <li key={`${l.category}-${l.teamAbbr}-${i}`}>
                    <span className="text-gold-400">{l.category}</span>{" "}
                    <span className="font-mono">{l.teamAbbr}</span> {l.player}
                    <span className="text-[var(--text-muted)]"> · {l.value}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {!live && header.kind === "scheduled" ? (
        <p className="text-[10px] text-[var(--text-muted)]">
          Kickoff {formatKickoffForScores(game.kickoff)}
          {game.network ? ` · ${game.network}` : ""}
        </p>
      ) : null}
    </ModalDialog>
  );
}
