"use client";

import Link from "next/link";
import { useState } from "react";
import { INVITE_CODE } from "@/lib/constants";
import { submitCredentialsLogin } from "@/lib/client-auth";

export default function JoinPage() {
  const [inviteCode, setInviteCode] = useState(INVITE_CODE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode, email, password, nickname, realName }),
      });
      let data: { error?: string; ok?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        setErr(`Join failed (HTTP ${res.status}). Try again on this same link.`);
        return;
      }
      if (!res.ok) {
        setErr(data.error || `Join failed (HTTP ${res.status})`);
        return;
      }
      submitCredentialsLogin(email, password, "/pool");
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "network";
      setErr(`Join failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">Join the pool</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Invite-only. Choose a nickname your friends will recognise.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 card-glass p-5">
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Invite code</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            className="mt-1 font-mono tracking-widest"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Nickname (unique in pool)</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Real name (optional)</span>
          <input
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1"
          />
        </label>
        {err && <p className="text-crimson-400 text-sm">{err}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Joining…" : "Join pool"}
        </button>
      </form>
    </main>
  );
}
