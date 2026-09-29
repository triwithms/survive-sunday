"use client";

import { useState, type FormEvent } from "react";
import { submitCredentialsLogin } from "@/lib/client-auth";

export function PoolJoinForm({
  token,
  poolName,
}: {
  token: string;
  poolName: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/join/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password, nickname }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error || "Could not join");
        setBusy(false);
        return;
      }
      submitCredentialsLogin(email.trim(), password, "/pick");
    } catch {
      setErr("Could not join");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void onSubmit(event)} className="card-glass space-y-4 p-5 mt-4">
      <p className="text-sm text-[var(--text-muted)]">
        You are joining <strong className="text-[var(--text-primary)]">{poolName}</strong>.
        Choose your email, password, and the name that shows on the board.
        Next time, use Sign in. This is not a code for every pool.
      </p>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Email</span>
        <input
          type="email"
          required
          value={email}
          disabled={busy}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full"
          autoComplete="email"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          disabled={busy}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full"
          autoComplete="new-password"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Display name</span>
        <input
          required
          maxLength={24}
          value={nickname}
          disabled={busy}
          onChange={(event) => setNickname(event.target.value)}
          className="mt-1 w-full"
        />
      </label>
      {err ? (
        <p className="text-sm text-crimson-400" role="alert">
          {err}
        </p>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Joining…" : "Join"}
      </button>
    </form>
  );
}
