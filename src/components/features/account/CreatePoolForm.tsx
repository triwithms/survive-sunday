"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";

export function CreatePoolForm() {
  const [name, setName] = useState("");
  const [mulligan, setMulligan] = useState("classic");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/pools", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mulligan }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not start the pool");
        setBusy(false);
        return;
      }
      window.location.assign("/pick");
    } catch {
      setError("Could not start the pool");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void onSubmit(event)}
      className="card-glass space-y-3 p-4"
      data-testid="create-pool"
    >
      <div>
        <h2 className="font-semibold text-[var(--text-primary)]">Start a pool</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Your current pool stays as it is. You become the administrator of the
          new one. The NFL schedule and scores stay shared.
        </p>
      </div>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Pool name</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={48}
          required
          disabled={busy}
          className="mt-1 w-full"
          data-testid="create-pool-name"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Mulligan</span>
        <select
          className="mt-1 w-full"
          value={mulligan}
          disabled={busy}
          onChange={(event) => setMulligan(event.target.value)}
          data-testid="create-pool-mulligan"
        >
          <option value="classic">One free mulligan</option>
          <option value="none">No mulligan — one loss and you are out</option>
        </select>
      </label>
      {error ? <p className="text-xs text-crimson-400">{error}</p> : null}
      <Button type="submit" pending={busy} disabled={busy || name.trim().length < 2}>
        Create pool
      </Button>
    </form>
  );
}
