"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RESET_POOL_CONFIRM } from "@/lib/constants";

type PoolMode = "demo" | "live";

type Preview = {
  poolName: string;
  pickCount: number;
  demoMembersToRemove: { nickname: string; email: string }[];
  membersKept: { nickname: string; email: string; role: string }[];
  weekCount: number;
};

export function PoolModePanel({
  initialMode,
  isPracticeLogin = false,
}: {
  initialMode: PoolMode;
  isPracticeLogin?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<PoolMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [typed, setTyped] = useState("");
  const [switchToLive, setSwitchToLive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reset-pool")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.ok) {
          setPreview({
            poolName: data.poolName,
            pickCount: data.pickCount,
            demoMembersToRemove: data.demoMembersToRemove ?? [],
            membersKept: data.membersKept ?? [],
            weekCount: data.weekCount,
          });
        }
      })
      .catch(() => {
        /* preview is optional until they open reset */
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  async function setPoolMode(next: PoolMode) {
    if (next === mode) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/pool-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not change mode");
        return;
      }
      setMode(next);
      setMsg(
        next === "live"
          ? "Real mode is on. The pool is Week 1. Week 2 practice picks are cleared. Friends pick their name from the live roster, then set their own email and password."
          : "Demo mode is on. Week 2 is the commissioner sandbox. The practice picker is visible on home and sign-in."
      );
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function runReset() {
    if (typed.trim() !== RESET_POOL_CONFIRM) {
      setErr(`Type ${RESET_POOL_CONFIRM} in the box to confirm.`);
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/reset-pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirm: typed.trim(),
          switchToLive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Reset failed");
        return;
      }
      if (switchToLive) setMode("live");
      setShowConfirm(false);
      setTyped("");
      setMsg(
        `Pool reset. Cleared ${data.pickCount ?? 0} picks, removed ${
          data.removedDemoUsers ?? 0
        } practice accounts, and set the pool to Week 1. Next: Import week picks.`
      );
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  const isLive = mode === "live";

  return (
    <div className="space-y-4">
      <section
        id="pool-mode"
        className="card-glass p-4 space-y-3 border border-gold-400/40"
      >
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-gold-400">
            Do this on your phone
          </p>
          <h2 className="font-semibold text-lg mt-1">Real mode vs Demo mode</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Tap a button to switch. Real mode is Week 1 (this NFL week) and
            hides the practice picker from friends. Week 2 exists only in Demo
            mode, for you.
          </p>
        </div>
        <p className="text-sm">
          Current:{" "}
          <span className="chip chip-gold">
            {isLive ? "Real mode" : "Demo mode"}
          </span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`${isLive ? "btn-primary" : "btn-secondary"} text-base min-h-[52px]`}
            disabled={busy || isLive}
            onClick={() => setPoolMode("live")}
          >
            Real mode
          </button>
          <button
            type="button"
            className={`${!isLive ? "btn-primary" : "btn-secondary"} text-base min-h-[52px]`}
            disabled={busy || !isLive}
            onClick={() => setPoolMode("demo")}
          >
            Demo mode
          </button>
        </div>
        {isPracticeLogin && (
          <p className="text-sm text-[var(--text-muted)]">
            You can turn Real mode on now. Then save your real email in{" "}
            <strong className="text-[var(--text-primary)]">
              Your commissioner login
            </strong>{" "}
            below so you can sign back in. Friends will not see practice emails
            or passwords.
          </p>
        )}
        <ul className="text-xs text-[var(--text-muted)] list-disc pl-5 space-y-1">
          <li>
            <strong className="text-[var(--text-primary)]">Real:</strong> Week 1
            board and picks. Home shows Who are you? (live roster), Join, and Sign in.
          </li>
          <li>
            <strong className="text-[var(--text-primary)]">Demo:</strong> Week 2
            sandbox for you, plus the practice picker on this Admin flow.
          </li>
        </ul>
      </section>

      <section className="card-glass p-4 space-y-3 border border-crimson-400/30">
        <div>
          <h2 className="font-semibold text-crimson-400">Reset pool</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Optional. Real mode already uses Week 1. Reset when you want a
            clean board before importing real Week 1 picks. It does{" "}
            <strong className="text-[var(--text-primary)]">not</strong> wipe
            sign-in settings, the schedule, or your commissioner account.
          </p>
        </div>

        {preview && (
          <div className="text-sm space-y-2">
            <p>
              This will clear <strong>{preview.pickCount}</strong> pick
              {preview.pickCount === 1 ? "" : "s"} and reset survival status for
              remaining members.
            </p>
            {preview.demoMembersToRemove.length > 0 && (
              <p>
                Practice accounts to remove:{" "}
                {preview.demoMembersToRemove.map((m) => m.nickname).join(", ")}.
              </p>
            )}
            {preview.membersKept.length > 0 && (
              <p className="text-[var(--text-muted)]">
                Kept (reset to undefeated):{" "}
                {preview.membersKept
                  .map((m) =>
                    m.role === "admin" ? `${m.nickname} (commissioner)` : m.nickname
                  )
                  .join(", ")}
                .
              </p>
            )}
          </div>
        )}

        {!showConfirm ? (
          <button
            type="button"
            className="btn-danger w-full"
            disabled={busy}
            onClick={() => {
              setShowConfirm(true);
              setErr("");
              setMsg("");
            }}
          >
            Start reset…
          </button>
        ) : (
          <div className="space-y-3 rounded-lg border border-crimson-400/40 p-3">
            <p className="text-sm text-[var(--text-primary)]">
              This cannot be undone. Type{" "}
              <span className="font-mono font-semibold">{RESET_POOL_CONFIRM}</span>{" "}
              to continue.
            </p>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={switchToLive}
                onChange={(e) => setSwitchToLive(e.target.checked)}
              />
              <span>Also switch to Real mode after reset (recommended)</span>
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value.toUpperCase())}
              autoComplete="off"
              placeholder={RESET_POOL_CONFIRM}
              aria-label="Type RESET to confirm"
              className="font-mono tracking-widest"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-danger w-full"
                disabled={busy || typed.trim() !== RESET_POOL_CONFIRM}
                onClick={runReset}
              >
                {busy ? "Resetting…" : "Yes, reset the pool"}
              </button>
              <button
                type="button"
                className="btn-secondary w-full"
                disabled={busy}
                onClick={() => {
                  setShowConfirm(false);
                  setTyped("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {msg && (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      )}
      {err && (
        <p className="text-sm text-crimson-400" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
