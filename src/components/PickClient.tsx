"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatKickoff } from "@/lib/utils";

type TeamOpt = {
  abbr: string;
  name: string;
  logoUrl: string | null;
  onBye: boolean;
  alreadyUsed: boolean;
  disabled: boolean;
  game: {
    id: string;
    awayAbbr: string;
    homeAbbr: string;
    kickoff: string;
    spreadHome: number | null;
    spreadAway: number | null;
    mlHome: number | null;
    mlAway: number | null;
    network: string | null;
  } | null;
};

function spreadLabel(team: TeamOpt): string {
  const game = team.game;
  if (!game) return "";
  const raw =
    team.abbr === game.homeAbbr ? game.spreadHome : game.spreadAway;
  if (raw == null || Number.isNaN(Number(raw))) return "";
  return ` · ${raw}`;
}

export function PickClient({
  weekNumber,
  locked,
  eliminated,
  currentPick,
  teams,
}: {
  weekNumber: number;
  locked: boolean;
  eliminated: boolean;
  currentPick: string | null;
  teams: TeamOpt[];
}) {
  const [selected, setSelected] = useState<string | null>(currentPick ?? null);
  const [confirm, setConfirm] = useState<TeamOpt | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const router = useRouter();

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
    setMsg("Locked in — nice one.");
    router.refresh();
  }

  if (eliminated) {
    return (
      <p className="text-[var(--text-muted)]">
        You&apos;re eliminated — no more picks this season. Cheer (or roast) from
        the sidelines.
      </p>
    );
  }

  const list = Array.isArray(teams) ? teams : [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide">
          Week {weekNumber} pick
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {locked
            ? "Week locked — picks are read-only."
            : "One team. No reuse. Bye teams disabled."}
        </p>
        {currentPick && (
          <p className="mt-2 text-sm">
            Current:{" "}
            <span className="font-mono text-gold-400">{currentPick}</span>
          </p>
        )}
      </div>

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
        <p
          className={`text-sm ${
            msg.includes("nice") ? "text-field-400" : "text-crimson-400"
          }`}
        >
          {msg}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {list
          .filter((t) => t && (t.game || t.onBye || t.alreadyUsed))
          .map((t) => {
            const isSel = selected === t.abbr;
            return (
              <button
                key={t.abbr}
                type="button"
                disabled={t.disabled}
                onClick={() => !t.disabled && setConfirm(t)}
                className={`card-glass p-3 text-left transition ${
                  isSel ? "ring-2 ring-gold-400" : ""
                } ${t.disabled ? "opacity-40 cursor-not-allowed" : "hover:border-gold-400"}`}
              >
                <div className="font-mono font-semibold text-gold-400">
                  {t.abbr}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {t.name}
                </div>
                {t.alreadyUsed && (
                  <div className="text-[10px] text-crimson-400 mt-1">
                    Already used
                  </div>
                )}
                {t.onBye && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    Bye
                  </div>
                )}
                {t.game && !t.onBye && (
                  <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                    vs{" "}
                    {t.abbr === t.game.homeAbbr
                      ? t.game.awayAbbr
                      : t.game.homeAbbr}
                    {spreadLabel(t)}
                  </div>
                )}
              </button>
            );
          })}
      </div>

      {confirm && confirm.game && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
          <div className="card-glass w-full max-w-sheet p-5 space-y-3">
            <h2 className="font-semibold text-lg">Confirm pick</h2>
            <p className="text-2xl font-mono text-gold-400">{confirm.abbr}</p>
            <p className="text-sm text-[var(--text-muted)]">
              {confirm.game.awayAbbr} @ {confirm.game.homeAbbr}
            </p>
            <p className="text-sm">{formatKickoff(confirm.game.kickoff)}</p>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Spread: home {confirm.game.spreadHome ?? "—"} / away{" "}
              {confirm.game.spreadAway ?? "—"}
              {confirm.game.mlHome != null &&
                ` · ML ${confirm.game.mlHome} / ${confirm.game.mlAway ?? "—"}`}
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
                disabled={busy || locked}
                onClick={() => submit(confirm.abbr)}
              >
                {busy ? "Saving…" : "Lock in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
