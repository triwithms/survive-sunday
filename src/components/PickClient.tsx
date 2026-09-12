"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { formatKickoff } from "@/lib/utils";
import {
  formatCurrentStanding,
  formatPriorYearRank,
  resolveFavourite,
  type StandingBits,
} from "@/lib/matchup-meta";

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
  network: string | null;
  spreadHome: number | null;
  spreadAway: number | null;
  mlHome: number | null;
  mlAway: number | null;
  away: Side;
  home: Side;
};

function TeamLogo({
  abbr,
  logoUrl,
  size = 40,
}: {
  abbr: string;
  logoUrl: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-[var(--stadium-700)] font-mono text-xs font-semibold text-gold-400"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {abbr.slice(0, 3)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full object-contain bg-[var(--stadium-700)]"
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

export function PickClient({
  weekNumber,
  locked,
  eliminated,
  currentPick,
  games,
}: {
  weekNumber: number;
  locked: boolean;
  eliminated: boolean;
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
  const readOnly = locked || eliminated;

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
    setConfirm({ side, matchup });
  }

  const list = Array.isArray(games) ? games : [];

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
          <p className="text-sm text-[var(--text-muted)]">
            {eliminated
              ? "You're eliminated — matchups are read-only."
              : locked
                ? "Week locked — picks are read-only."
                : "Tap a side to pick that team. One team. No reuse."}
          </p>
          {currentPick && (
            <div className="mt-2 space-y-1 text-sm">
              <p>
                Current:{" "}
                <span className="font-mono text-gold-400">{currentPick}</span>
              </p>
              {!readOnly && (
                <p className="text-[var(--text-muted)]">
                  Tap another side to change your pick before lock.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {eliminated && (
        <div
          role="status"
          className="card-glass border border-crimson-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-crimson-400">Eliminated this season</p>
          <p className="text-[var(--text-muted)]">
            No more picks — you can still browse the slate below.
          </p>
        </div>
      )}

      {locked && !eliminated && (
        <div
          role="status"
          className="card-glass border border-gold-400/40 p-3 text-sm space-y-1"
        >
          <p className="font-semibold text-gold-400">
            Week {weekNumber} is locked (season in progress).
          </p>
          <p className="text-[var(--text-muted)]">
            Picks cannot change. Commissioner can reopen for demo from the
            Admin page (&quot;Reopen week for picks&quot;).
          </p>
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

      <ul className="space-y-3">
        {list.map((m) => {
          const fav = resolveFavourite({
            homeAbbr: m.home.abbr,
            awayAbbr: m.away.abbr,
            spreadHome: m.spreadHome,
            spreadAway: m.spreadAway,
          });
          return (
            <li key={m.id} className="card-glass overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--stadium-border)] px-3 py-2 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono">{formatKickoff(m.kickoff)}</span>
                {m.network && (
                  <span className="uppercase tracking-wide">{m.network}</span>
                )}
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-1 p-2 sm:gap-2 sm:p-3">
                <SideButton
                  side={m.away}
                  selected={selected === m.away.abbr}
                  readOnly={readOnly}
                  align="away"
                  favSpread={
                    fav && fav.abbr === m.away.abbr ? fav.spread : null
                  }
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
                  readOnly={readOnly}
                  align="home"
                  favSpread={
                    fav && fav.abbr === m.home.abbr ? fav.spread : null
                  }
                  onPick={() => trySelect(m.home, m)}
                />
              </div>

              {fav && (
                <div className="border-t border-[var(--stadium-border)] px-3 py-1.5 text-center text-[11px] text-[var(--text-muted)]">
                  <span className="font-mono">{fav.label}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="card-glass w-full max-w-sheet p-5 space-y-3">
            <h2 className="font-semibold text-lg">Confirm pick</h2>
            <div className="flex items-center gap-3">
              <TeamLogo
                abbr={confirm.side.abbr}
                logoUrl={confirm.side.logoUrl}
                size={48}
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
            {(() => {
              const fav = resolveFavourite({
                homeAbbr: confirm.matchup.home.abbr,
                awayAbbr: confirm.matchup.away.abbr,
                spreadHome: confirm.matchup.spreadHome,
                spreadAway: confirm.matchup.spreadAway,
              });
              return fav ? (
                <p className="text-xs font-mono text-[var(--text-muted)]">
                  {fav.label}
                </p>
              ) : null;
            })()}
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Spread: home {confirm.matchup.spreadHome ?? "—"} / away{" "}
              {confirm.matchup.spreadAway ?? "—"}
              {confirm.matchup.mlHome != null &&
                ` · ML ${confirm.matchup.mlHome} / ${confirm.matchup.mlAway ?? "—"}`}
            </p>
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

function SideButton({
  side,
  selected,
  readOnly,
  align,
  favSpread,
  onPick,
}: {
  side: Side;
  selected: boolean;
  readOnly: boolean;
  align: "away" | "home";
  favSpread: number | null;
  onPick: () => void;
}) {
  const disabled = readOnly || side.alreadyUsed;
  const isAway = align === "away";
  const prior = formatPriorYearRank(side.priorYearRank);
  const current = formatCurrentStanding(side.standing);

  return (
    <button
      type="button"
      disabled={disabled && !selected}
      onClick={() => {
        if (readOnly || side.alreadyUsed) return;
        onPick();
      }}
      aria-pressed={selected}
      aria-label={`Pick ${side.name} (${side.abbr})`}
      className={`flex min-h-[88px] flex-col gap-1 rounded-lg border p-2 transition sm:p-3 ${
        isAway ? "items-start text-left" : "items-end text-right"
      } ${
        selected
          ? "border-gold-400 bg-gold-400/10 ring-2 ring-gold-400"
          : "border-transparent bg-[var(--stadium-700)]/40"
      } ${
        side.alreadyUsed && !selected
          ? "cursor-not-allowed opacity-40"
          : readOnly
            ? "cursor-default"
            : "hover:border-gold-400/60"
      } ${!disabled && !selected ? "active:scale-[0.98]" : ""}`}
    >
      <div
        className={`flex items-center gap-2 ${isAway ? "" : "flex-row-reverse"}`}
      >
        <TeamLogo abbr={side.abbr} logoUrl={side.logoUrl} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-sm font-semibold text-gold-400">
              {side.abbr}
            </span>
            {favSpread != null && (
              <span className="rounded bg-gold-400/15 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gold-400">
                Fav {favSpread}
              </span>
            )}
          </div>
          <div className="truncate text-xs text-[var(--text-muted)]">
            {side.name}
          </div>
        </div>
      </div>
      <div
        className={`space-y-0.5 text-[10px] leading-tight text-[var(--text-muted)] ${
          isAway ? "text-left" : "text-right"
        }`}
      >
        {prior && <div>{prior}</div>}
        {current && <div>{current}</div>}
      </div>
      {side.alreadyUsed && (
        <div className="text-[10px] text-crimson-400">Already used</div>
      )}
    </button>
  );
}
