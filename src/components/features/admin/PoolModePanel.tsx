"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@/components/ui";
import { PoolModeHelp } from "./PoolModeHelp";

type PoolMode = "demo" | "live";

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
  const isLive = mode === "live";

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
          ? "Real mode is on. The pool is Week 1. Week 2 stays on the schedule."
          : "Demo mode is on. The practice picker is visible on home and sign-in."
      );
      router.refresh();
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
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
          Real mode is Week 1 and hides the practice picker. Week 2 stays on
          the schedule.
        </p>
      </div>
      <p className="text-sm">
        Current: <Chip>{isLive ? "Real mode" : "Demo mode"}</Chip>
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="text-base min-h-[52px]"
          disabled={busy || isLive}
          onClick={() => void setPoolMode("live")}
        >
          Real mode
        </Button>
        <Button
          variant="secondary"
          className="text-base min-h-[52px]"
          disabled={busy || !isLive}
          onClick={() => void setPoolMode("demo")}
        >
          Demo mode
        </Button>
      </div>
      <PoolModeHelp isPracticeLogin={isPracticeLogin} />
      {msg ? <p className="text-sm text-field-400" role="status">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
    </section>
  );
}
