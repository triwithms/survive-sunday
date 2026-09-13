"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PoolRulesForm({
  currentWeek,
  singleEliminationFromWeek,
  oneLossCount,
  undefeatedCount,
}: {
  currentWeek: number;
  singleEliminationFromWeek: number | null;
  oneLossCount: number;
  undefeatedCount: number;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(singleEliminationFromWeek != null);
  const [fromWeek, setFromWeek] = useState(
    singleEliminationFromWeek ?? currentWeek
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const choices = Array.from({ length: 18 }, (_, i) => i + 1);

  async function save() {
    const next = enabled ? fromWeek : null;
    const confirmText = enabled
      ? `Turn off the free mulligan from Week ${fromWeek}? Already-graded weeks stay as they are. People on One loss stay in.`
      : "Turn the free mulligan back on for weeks that are not graded yet?";
    if (!window.confirm(confirmText)) return;

    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/pool-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ singleEliminationFromWeek: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save pool rules.");
      return;
    }
    setMsg(data.summary || "Saved.");
    router.refresh();
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <h2 className="font-semibold">Pool rules — mulligan</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Right now:{" "}
        {singleEliminationFromWeek == null
          ? "everyone gets one free mulligan. First loss keeps them in."
          : `from Week ${singleEliminationFromWeek}, one loss puts a player out (no mulligan).`}
      </p>

      <label className="flex items-start gap-3 text-sm min-h-11">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--gold-400,#d4a017)]"
          checked={enabled}
          onChange={(e) => {
            setEnabled(e.target.checked);
            if (e.target.checked && fromWeek < currentWeek) {
              setFromWeek(currentWeek);
            }
          }}
        />
        <span>
          Turn off the free mulligan (one loss = out) from a chosen week.
        </span>
      </label>

      {enabled && (
        <label className="block text-sm space-y-1">
          <span className="text-[var(--text-muted)]">Starting from</span>
          <select
            className="w-full min-h-11 rounded-md bg-stadium-800 border border-stadium-border px-3"
            value={fromWeek}
            onChange={(e) => setFromWeek(Number(e.target.value))}
          >
            {choices.map((n) => (
              <option key={n} value={n}>
                {n < currentWeek
                  ? `Week ${n} (already started — old results stay)`
                  : n === currentWeek
                    ? `This week (Week ${n}) — immediately`
                    : `Week ${n}`}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="text-xs text-[var(--text-muted)] space-y-2">
        <p>
          <strong className="text-[var(--text-primary)]">Safe for people
          already on One loss:</strong>{" "}
          {oneLossCount} player{oneLossCount === 1 ? "" : "s"} already used
          their mulligan. They stay in. Their next loss still puts them out.
        </p>
        <p>
          {undefeatedCount} player{undefeatedCount === 1 ? "" : "s"} still have
          an unused mulligan. From the week you choose, that unused mulligan
          will not save them.
        </p>
        <p>
          Already-scored weeks are not re-graded. We do not go back and
          eliminate anyone for an old loss.
        </p>
        <p>
          Players will see:{" "}
          <span className="text-gold-400">
            {enabled
              ? `From Week ${fromWeek}: no mulligan / one-and-done.`
              : "the usual mulligan rule."}
          </span>
        </p>
      </div>

      <button
        type="button"
        className="btn-primary w-full min-h-11"
        disabled={busy}
        onClick={save}
      >
        {busy ? "Saving…" : "Save pool rules"}
      </button>
      {msg && (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      )}
    </section>
  );
}
