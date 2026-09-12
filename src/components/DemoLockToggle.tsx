"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Visible demo/testing control: Before lock | After lock.
 * Available to any demo-pool member (e.g. Gams), not just commissioner.
 */
export function DemoLockToggle({
  locked,
  weekNumber,
}: {
  locked: boolean;
  weekNumber: number;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function setMode(mode: "before_lock" | "after_lock") {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/demo/lock-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Failed");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setErr("Network error");
    }
    setBusy(false);
  }

  return (
    <div
      className="mx-auto max-w-pool w-full px-3 sm:px-4 pb-2"
      data-testid="demo-lock-toggle"
    >
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-gold-400/40 bg-gold-400/5 px-2.5 py-1.5">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-gold-400 shrink-0">
          Demo / testing
        </span>
        <span className="text-[11px] text-[var(--text-muted)] shrink-0">
          Test time · W{weekNumber}:
        </span>
        <div className="inline-flex rounded-full border border-stadium-border p-0.5 gap-0.5">
          <button
            type="button"
            disabled={busy || !locked}
            onClick={() => setMode("before_lock")}
            className={[
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              !locked
                ? "bg-gold-400/20 text-gold-400"
                : "text-[var(--text-muted)] hover:text-gold-400 disabled:opacity-50",
            ].join(" ")}
            aria-pressed={!locked}
          >
            Before lock
          </button>
          <button
            type="button"
            disabled={busy || locked}
            onClick={() => setMode("after_lock")}
            className={[
              "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              locked
                ? "bg-gold-400/20 text-gold-400"
                : "text-[var(--text-muted)] hover:text-gold-400 disabled:opacity-50",
            ].join(" ")}
            aria-pressed={locked}
          >
            After lock
          </button>
        </div>
        {busy && (
          <span className="text-[10px] text-[var(--text-muted)]">Updating…</span>
        )}
        {err && <span className="text-[10px] text-red-400">{err}</span>}
      </div>
    </div>
  );
}
