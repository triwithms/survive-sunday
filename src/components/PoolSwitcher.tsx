"use client";

import { useState } from "react";
import type { PoolChoice } from "@/lib/active-pool";

export function PoolSwitcher({
  pools,
  activePoolId,
}: {
  pools: PoolChoice[];
  activePoolId: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (pools.length < 2) return null;

  async function onChange(poolId: string) {
    if (!poolId || poolId === activePoolId) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/active-pool", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || "Could not switch pools");
        setBusy(false);
        return;
      }
      window.location.assign("/pick");
    } catch {
      setError("Could not switch pools");
      setBusy(false);
    }
  }

  return (
    <label className="block text-sm" data-testid="pool-switcher">
      <span className="text-[var(--text-muted)]">Pool</span>
      <select
        className="mt-1 w-full"
        value={activePoolId ?? pools[0]?.id ?? ""}
        disabled={busy}
        onChange={(event) => void onChange(event.target.value)}
      >
        {pools.map((pool) => (
          <option key={pool.id} value={pool.id}>
            {pool.name}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-crimson-400">{error}</p> : null}
    </label>
  );
}
