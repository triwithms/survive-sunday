"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatKickoff } from "@/lib/utils";
import { isGameStarted } from "@/lib/pick-change";
import {
  pickScreenCopy,
  type PlayerPickWeek,
} from "@/lib/next-week-picks";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
  type StandingBits,
} from "@/lib/matchup-meta";
import { TeamLogo, TEAM_LOGO_SIZE } from "@/components/TeamLogo";
import { NextWeekOpenTip } from "@/components/NextWeekOpenTip";
import { formatMatchupListLine } from "@/lib/game-display";

type Side = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  alreadyUsed: boolean;
  priorYearRank: number | null;
  standing: StandingBits | null;
};

type Matchup = {
  id: string;
  kickoff: string;
  status: string;
  scoreAway: number | null;
  scoreHome: number | null;
  note: string | null;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  away: Side;
  home: Side;
};

export function PickClient({
  weekNumber,
  decision,
  locked,
  canChange,
  eliminated,
  spectator = false,
  currentPick,
  games,
}: {
  weekNumber: number;
  decision: PlayerPickWeek;
  locked: boolean;
  canChange: boolean;
  eliminated: boolean;
  spectator?: boolean;
  currentPick: string | null;
  games: Matchup[];
}) {
  const [selected, setSelected] = useState<string | null>(currentPick ?? null);
  const [confirm, setConfirm] = useState<{ side: Side; matchup: Matchup } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const router = useRouter();
  const copy = pickScreenCopy({
    weekNumber,
    decision,
    locked,
    canChange,
    eliminated,
    spectator,
    hasCurrentPick: Boolean(currentPick),
  });
  const lockStartedGames =
    copy.showWeek1ChangeCard && locked && canChange;
  const readOnly = !canChange || eliminated || spectator;

  useEffect(() => {
    setSelected(currentPick ?? null);
    setConfirm(null);
    setMsg("");
    setRedirectIn(null);
  }, [weekNumber, currentPick]);

  useEffect(() => {
    if (redirectIn == null) return;
    if (redirectIn <= 0) {
      router.push("/pool");
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, router]);

  async function submit(abbr: string) {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber, teamAbbr: abbr }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      if (res.status === 403 && (data.locked || /locked/i.test(data.error || ""))) {
        setMsg(data.error || "Week is locked — picks cannot change");
        router.refresh();
        return;
      }
      setMsg(data.error || "Could not save pick");
      return;
    }
    setSelected(abbr);
    setConfirm(null);
    const updated = currentPick && currentPick !== abbr;
    setMsg(updated ? "Pick updated — heading back to pool…" : "Locked in — heading back to pool…");
    setRedirectIn(2);
    router.refresh();
  }

  function trySelect(side: Side, matchup: Matchup) {
    if (readOnly) return;
    if (side.alreadyUsed) return;
    if (lockStartedGames && isGameStarted(matchup)) return;
    setConfirm({ side, matchup });
  }

  const list = Array.isArray(games) ? games : [];
  const activePick = selected ?? currentPick;
  const activeMatchup = activePick
    ? list.find(
        (m) => m.away.abbr === activePick || m.home.abbr === activePick
      ) ?? null
    : null;
  const activeSide = activeMatchup
    ? activeMatchup.away.abbr === activePick
      ? activeMatchup.away
      : activeMatchup.home
    : null;
  const activeOpp = activeMatchup
    ? activeMatchup.away.abbr === activePick
      ? activeMatchup.home
      : activeMatchup.away
    : null;
  const activePrior = activeSide
    ? formatPriorYearRank(activeSide.priorYearRank)
    : null;
  const activeStanding = activeSide?.standing
    ? formatCurrentStanding(activeSide.standing)
    : null;
  const activeListLine = activeMatchup
    ? formatMatchupListLine(activeMatchup)
    : null;
  const activeFav = activeMatchup ? favouriteFor(activeMatchup) : null;
  const confirmFav = confirm ? favouriteFor(confirm.matchup) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href="/pool"
            prefetch={false}
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-gold-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to pool
          </Link>
          <h1 className="font-display text-2xl text-gold-400 tracking-wide">
            Week {weekNumber} pick
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{copy.kicker}</p>
        </div>
      </div>

      <section
        className="card-glass p-4 border border-gold-400/30"
        aria-label="Your current pick"
      >
        <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
          Your pick
        </p>
        {activeSide ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <TeamLogo
                abbr={activeSide.abbr}
                logoUrl={activeSide.logoUrl}
                size={TEAM_LOGO_SIZE.featured}
              />
              <div className="min-w-0">
                <p className="font-mono text-2xl font-semibold text-gold-400 leading-none">
                  {activeSide.abbr}
                </p>
                <p className="text-sm text-[var(--text-primary)] truncate mt-1">
                  {activeSide.name}
                </p>
                {activeOpp && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    vs {activeOpp.abbr}
                    {activeListLine
                      ? ` · ${activeListLine}`
                      : activeMatchup?.kickoff
                        ? ` · ${formatKickoff(activeMatchup.kickoff)}`
                        : ""}
                  </p>
                )}
                {activeFav && (
                  <p className="text-xs font-mono text-[var(--text-primary)] mt-0.5">
                    {activeFav.label}
                  </p>
                )}
                {(activePrior || activeStanding) && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {[activePrior, activeStanding].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href={`/team/${activeSide.abbr}`}
                prefetch={false}
                className="btn-secondary text-sm"
              >
                Team details
              </Link>
              {!readOnly && (
                <span className="text-xs text-[var(--text-muted)]">
                  {copy.showWeek1ChangeCard
                    ? "Pick another not-started game below to change"
                    : "Pick another side below to change"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-[var(--text-muted)]">
              {readOnly
                ? decision.nextWeekOpen &&
                  weekNumber === decision.poolCurrentWeek
                  ? `No Week ${weekNumber} pick — ${copy.banner?.title ?? `Week ${decision.nextWeek} is open.`}`
                  : "No pick recorded for this week."
                : "No pick yet — choose a side from this week's games below."}
            </p>
          </div>
        )}
      </section>

      {spectator && (
        <div
          role="status"
          className="card-glass border border-gold-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-gold-400">Commissioner view</p>
          <p className="text-[var(--text-muted)]">
            You&apos;re not a player in this pool, so you don&apos;t need to
            pick. Use Admin to change rules or hand the pool to someone else.
          </p>
        </div>
      )}

      {eliminated && (
        <div
          role="status"
          className="card-glass border border-crimson-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-crimson-400">Eliminated this season</p>
          <p className="text-[var(--text-muted)]">
            No more picks — you can still browse this week&apos;s games below.
          </p>
        </div>
      )}

      {copy.showWeek1ChangeCard && !eliminated && (
        <div
          role="status"
          className="card-glass border border-gold-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-gold-400">Week 1 pick changes</p>
          <p className="text-[var(--text-muted)]">
            You can switch to any other team whose game has not started yet.
            Once your pick’s kickoff starts, that pick locks and next week
            opens for you.
          </p>
        </div>
      )}

      {copy.showDismissibleTip && (
        <NextWeekOpenTip weekNumber={decision.nextWeek} />
      )}

      {copy.banner && !eliminated && (
        <div
          role="status"
          className="card-glass border border-gold-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-gold-400">{copy.banner.title}</p>
          <p className="text-[var(--text-muted)]">{copy.banner.body}</p>
          {copy.banner.href && copy.banner.hrefLabel && (
            <p>
              <Link
                href={copy.banner.href}
                prefetch={false}
                className="btn-primary inline-flex text-sm mt-1"
              >
                {copy.banner.hrefLabel}
              </Link>
            </p>
          )}
        </div>
      )}

      {msg && (
        <div
          className={`rounded-lg border p-3 text-sm space-y-2 ${
            msg.includes("heading") || msg.includes("updated") || msg.includes("Locked")
              ? "border-field-400/40 text-field-400"
              : "border-crimson-400/40 text-crimson-400"
          }`}
        >
          <p>{msg}</p>
          {redirectIn != null && (
            <Link
              href="/pool"
              prefetch={false}
              className="btn-primary inline-flex text-sm"
            >
              Back to pool{redirectIn > 0 ? ` (${redirectIn})` : ""}
            </Link>
          )}
        </div>
      )}

      <section aria-label="This week's games" className="space-y-3">
        <h2 className="text-sm font-semibold text-gold-400 tracking-wide">
          This week&apos;s games
        </h2>
      {list.length === 0 ? (
        <div className="card-glass p-4 text-sm text-[var(--text-muted)]">
          Games for Week {weekNumber} have not been added yet.
        </div>
      ) : (
      <ul className="space-y-3">
        {list.map((m) => {
          const fav = favouriteFor(m);
          const gameClosed = lockStartedGames && isGameStarted(m);
          return (
            <li key={m.id} className="card-glass overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--stadium-border)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-mono">
                    {formatMatchupListLine(m) || formatKickoff(m.kickoff)}
                  </span>
                  {fav && (
                    <span className="text-[var(--text-primary)]">
                      {fav.label}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {m.status === "live" && (
                    <span className="chip chip-live text-[10px]">LIVE</span>
                  )}
                  {gameClosed && m.status !== "live" && (
                    <span className="text-[10px] uppercase tracking-wide">
                      Started
                    </span>
                  )}
                </span>
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 p-2 sm:gap-2 sm:p-3">
                <SideButton
                  side={m.away}
                  selected={selected === m.away.abbr}
                  readOnly={readOnly || gameClosed}
                  gameClosed={gameClosed}
                  align="away"
                  onPick={() => trySelect(m.away, m)}
                />
                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    vs
                  </span>
                </div>
                <SideButton
                  side={m.home}
                  selected={selected === m.home.abbr}
                  readOnly={readOnly || gameClosed}
                  gameClosed={gameClosed}
                  align="home"
                  onPick={() => trySelect(m.home, m)}
                />
              </div>
            </li>
          );
        })}
      </ul>
      )}
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="card-glass w-full max-w-sheet p-5 space-y-3">
            <h2 className="font-semibold text-lg">Confirm pick</h2>
            <div className="flex items-center gap-3">
              <TeamLogo
                abbr={confirm.side.abbr}
                logoUrl={confirm.side.logoUrl}
                size={TEAM_LOGO_SIZE.featured}
              />
              <div>
                <p className="text-2xl font-mono text-gold-400">
                  {confirm.side.abbr}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {confirm.side.name}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {[
                    formatPriorYearRank(confirm.side.priorYearRank),
                    formatCurrentStanding(confirm.side.standing),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {confirm.matchup.away.abbr} @ {confirm.matchup.home.abbr}
            </p>
            <p className="text-sm">{formatKickoff(confirm.matchup.kickoff)}</p>
            {confirmFav ? (
              <p className="text-xs text-[var(--text-primary)]">
                {confirmFav.label}
              </p>
            ) : null}
            <p className="text-xs text-[var(--text-muted)]">
              Odds are informational only — not for wagering.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={busy || readOnly}
                onClick={() => submit(confirm.side.abbr)}
              >
                {busy ? "Saving…" : currentPick ? "Change pick" : "Lock in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function favouriteFor(m: Matchup) {
  return resolveFavourite({
    homeAbbr: m.home.abbr,
    awayAbbr: m.away.abbr,
    spreadHome: m.spreadHome,
    spreadAway: m.spreadAway,
    mlHome: m.mlHome,
    mlAway: m.mlAway,
  });
}

function SideButton({
  side,
  selected,
  readOnly,
  gameClosed,
  align,
  onPick,
}: {
  side: Side;
  selected: boolean;
  readOnly: boolean;
  gameClosed?: boolean;
  align: "away" | "home";
  onPick: () => void;
}) {
  const disabled = readOnly || side.alreadyUsed || !!gameClosed;
  const isAway = align === "away";
  const prior = formatPriorYearRank(side.priorYearRank);
  const current = formatCurrentStanding(side.standing);

  return (
    <div
      className={`flex min-h-[88px] min-w-0 flex-col gap-1.5 rounded-lg border p-2 transition sm:p-3 ${
        isAway ? "items-start text-left" : "items-end text-right"
      } ${
        selected
          ? "border-gold-400 bg-gold-400/10 ring-2 ring-gold-400"
          : "border-transparent bg-[var(--stadium-700)]/40"
      } ${side.alreadyUsed && !selected ? "opacity-40" : ""}`}
    >
      {/* Logo + name → team research (Pick stays on its own button) */}
      <Link
        href={`/team/${side.abbr}`}
        prefetch={false}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Team details for ${side.name}`}
        className={`flex items-center gap-1.5 sm:gap-2 min-h-11 min-w-0 rounded-md hover:opacity-90 active:bg-gold-400/5 ${
          isAway ? "" : "flex-row-reverse"
        }`}
      >
        <TeamLogo abbr={side.abbr} logoUrl={side.logoUrl} size={TEAM_LOGO_SIZE.slate} />
        <div className="min-w-0">
          <span className="font-mono text-sm font-semibold text-gold-400 underline underline-offset-2 decoration-gold-400/40">
            {side.abbr}
          </span>
          <div className="truncate text-xs text-[var(--text-muted)] underline underline-offset-2 decoration-transparent hover:decoration-[var(--text-muted)]">
            {side.name}
          </div>
        </div>
      </Link>

      {(prior || current) && (
        <div
          className={`w-full space-y-0.5 text-[10px] leading-tight text-[var(--text-muted)] ${
            isAway ? "text-left" : "text-right"
          }`}
        >
          {prior && <div>{prior}</div>}
          {current && <div>{current}</div>}
        </div>
      )}

      {side.alreadyUsed ? (
        <div className="text-[10px] font-medium text-crimson-400">Already used</div>
      ) : gameClosed && !selected ? (
        <div className="text-[10px] font-medium text-[var(--text-muted)]">
          Game started
        </div>
      ) : !readOnly ? (
        <button
          type="button"
          disabled={disabled && !selected}
          onClick={(e) => {
            e.stopPropagation();
            if (readOnly || side.alreadyUsed || gameClosed) return;
            onPick();
          }}
          aria-pressed={selected}
          aria-label={`Pick ${side.name} (${side.abbr})`}
          className={`btn-primary w-full text-xs py-1.5 ${
            selected ? "ring-1 ring-gold-400" : ""
          }`}
        >
          {selected ? "Selected · confirm" : "Pick"}
        </button>
      ) : selected ? (
        <div className="text-[10px] font-medium text-gold-400">Your pick</div>
      ) : null}

      <Link
        href={`/team/${side.abbr}`}
        prefetch={false}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Team details for ${side.name}`}
        className="inline-flex items-center justify-center min-h-11 w-full rounded-md border border-sky-400/40 px-3 py-2 text-sm font-medium text-sky-300 hover:bg-sky-400/10 active:bg-sky-400/20"
      >
        Team details
      </Link>
    </div>
  );
}
