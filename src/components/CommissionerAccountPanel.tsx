"use client";

import { useState } from "react";
import { SignOutButton } from "@/components/SignOutButton";

export function CommissionerAccountPanel({
  currentEmail,
  isPracticeLogin,
}: {
  currentEmail: string | null;
  isPracticeLogin: boolean;
}) {
  const [email, setEmail] = useState(isPracticeLogin ? "" : currentEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [doneEmail, setDoneEmail] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) {
      setErr("Passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/commissioner-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not save login");
        return;
      }
      setDoneEmail(data.email);
      setPassword("");
      setConfirm("");
    } catch {
      setErr("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <div>
        <h2 className="font-semibold">Your commissioner login</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {isPracticeLogin
            ? "This is still a practice login. Save your real email and password, sign out, then sign in with those. After that, reset can wipe practice seats."
            : "Commissioner login is ready. After Real mode and reset, sign in on the Sign in page with this email — not a practice address."}
        </p>
      </div>
      <p className="text-sm">
        Current login:{" "}
        <span className="font-mono break-all">{currentEmail || "unknown"}</span>
        {isPracticeLogin ? (
          <span className="chip chip-gold ml-2">Practice — replace this</span>
        ) : (
          <span className="chip chip-gold ml-2">Ready</span>
        )}
      </p>

      {doneEmail ? (
        <div className="space-y-3">
          <p className="text-sm text-field-400" role="status">
            Saved. Sign out now, then sign in with <strong>{doneEmail}</strong>{" "}
            and the password you just chose. After that you can switch to Real
            mode and reset the pool.
          </p>
          <SignOutButton next="/login" className="btn-primary w-full">
            Sign out
          </SignOutButton>
        </div>
      ) : (
        <form onSubmit={save} className="space-y-3">
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Your real email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">New password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Confirm password</span>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="mt-1"
            />
          </label>
          {err && (
            <p className="text-sm text-crimson-400" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Saving…" : "Save real commissioner login"}
          </button>
        </form>
      )}

      {!doneEmail && (
        <SignOutButton next="/login" className="btn-secondary w-full">
          Sign out
        </SignOutButton>
      )}
    </section>
  );
}
