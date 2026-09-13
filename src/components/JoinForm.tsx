"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { INVITE_CODE } from "@/lib/constants";
import { afterAuthNavigate, signInCredentials } from "@/lib/client-auth";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { CLAIM_ERRORS } from "@/lib/claim-seat";
import { WhoAreYouSelect } from "@/components/WhoAreYouSelect";

export function JoinForm({ seats }: { seats: ClaimableSeat[] }) {
  const params = useSearchParams();
  const preselect = params.get("seat") ?? "";
  const initialSeat = seats.some((s) => s.membershipId === preselect)
    ? preselect
    : "";

  const [inviteCode, setInviteCode] = useState(INVITE_CODE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [membershipId, setMembershipId] = useState(initialSeat);
  const [newPlayer, setNewPlayer] = useState(seats.length === 0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const selected = useMemo(
    () => seats.find((s) => s.membershipId === membershipId),
    [seats, membershipId]
  );
  const claimed = Boolean(selected?.claimed);
  const canSubmit = newPlayer || (Boolean(membershipId) && !claimed);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setErr(CLAIM_ERRORS.alreadyClaimed);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          newPlayer
            ? { inviteCode, email, password, nickname, realName }
            : { inviteCode, email, password, membershipId }
        ),
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
      const login = await signInCredentials(email, password);
      if (!login.ok) {
        setErr(
          `Account created, but sign-in failed (${login.error || "unknown"}). Use Sign in on this same link.`
        );
        router.push("/login");
        return;
      }
      afterAuthNavigate("/pool");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "network";
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
        {newPlayer
          ? "Invite-only. Choose a nickname your friends will recognise."
          : "Pick yourself from the live roster, then set your own email and password. Your Week 1 picks stay with that name."}
      </p>
      <form onSubmit={onSubmit} className="space-y-4 card-glass p-5">
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Invite code</span>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            required
            className="mt-1 font-mono tracking-widest"
            autoComplete="off"
          />
        </label>

        {!newPlayer && seats.length > 0 && (
          <WhoAreYouSelect
            seats={seats}
            value={membershipId}
            onChange={setMembershipId}
          />
        )}

        {newPlayer && (
          <>
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
          </>
        )}

        {(!claimed || newPlayer) && (
          <>
            <label className="block text-sm">
              <span className="text-[var(--text-muted)]">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                autoComplete="email"
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
                autoComplete="new-password"
              />
            </label>
          </>
        )}

        {err && (
          <p className="text-crimson-400 text-sm" role="alert">
            {err}
          </p>
        )}

        {canSubmit && (
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy
              ? "Joining…"
              : selected
                ? `Join as ${selected.nickname}`
                : "Join pool"}
          </button>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          Already claimed your seat?{" "}
          <Link href="/login" className="text-gold-400">
            Sign in
          </Link>
        </p>
      </form>

      {seats.length > 0 && (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          {newPlayer ? (
            <button
              type="button"
              className="text-gold-400 underline-offset-2 hover:underline"
              onClick={() => {
                setNewPlayer(false);
                setErr("");
              }}
            >
              ← Back to the roster list
            </button>
          ) : (
            <button
              type="button"
              className="text-gold-400 underline-offset-2 hover:underline"
              onClick={() => {
                setNewPlayer(true);
                setMembershipId("");
                setErr("");
              }}
            >
              Not on this list? Join as a new player
            </button>
          )}
        </p>
      )}
    </main>
  );
}
