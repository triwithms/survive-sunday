"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { INVITE_CODE } from "@/lib/constants";
import {
  afterAuthNavigate,
  submitCredentialsLogin,
} from "@/lib/client-auth";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { CLAIM_ERRORS } from "@/lib/claim-seat";
import { normalizeAuthPassword } from "@/lib/auth-credentials";
import { WhoAreYouSelect } from "@/components/WhoAreYouSelect";
import {
  arrivedViaPersonalInvite,
  resolveSeatFromInvite,
} from "@/lib/invite-link";

export function JoinForm({
  seats,
  signedIn,
  tokenSeatId,
}: {
  seats: ClaimableSeat[];
  signedIn?: { email: string; userId: string } | null;
  tokenSeatId?: string | null;
}) {
  const params = useSearchParams();
  const tokenParam = params.get("t") ?? "";
  const seatParam = tokenSeatId || params.get("seat") || "";
  const whoParam = tokenSeatId ? "" : params.get("who") ?? "";
  const codeParam = (params.get("code") ?? "").trim().toUpperCase();
  const invited = resolveSeatFromInvite(seats, { seat: seatParam, who: whoParam });
  const viaPersonal =
    arrivedViaPersonalInvite({ seat: seatParam, who: whoParam }) ||
    Boolean(tokenParam || tokenSeatId);
  const initialSeat = invited && !invited.claimed ? invited.membershipId : "";

  const [inviteCode, setInviteCode] = useState(codeParam || INVITE_CODE);
  const [email, setEmail] = useState(signedIn?.email ?? "");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [realName, setRealName] = useState("");
  const [membershipId, setMembershipId] = useState(initialSeat);
  const [newPlayer, setNewPlayer] = useState(
    seats.length === 0 && !viaPersonal
  );
  const [dismissClaimedInvite, setDismissClaimedInvite] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signedIn?.email && !email) setEmail(signedIn.email);
  }, [signedIn?.email, email]);

  const selected = useMemo(
    () => seats.find((s) => s.membershipId === membershipId),
    [seats, membershipId]
  );
  const claimed = Boolean(selected?.claimed);
  const canSubmit = newPlayer || (Boolean(membershipId) && !claimed);
  const oneTapClaim = Boolean(signedIn && !newPlayer && membershipId && !claimed);
  const showPassword = !oneTapClaim && (newPlayer || (membershipId && !claimed));
  const signInToClaimHref = `/login?callbackUrl=${encodeURIComponent(
    membershipId ? `/join?seat=${encodeURIComponent(membershipId)}` : "/join"
  )}`;
  const showSignInToClaim =
    !signedIn &&
    !newPlayer &&
    Boolean(membershipId) &&
    !claimed &&
    (err === CLAIM_ERRORS.emailPasswordMismatch || Boolean(email));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setErr(CLAIM_ERRORS.alreadyClaimed);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const claimEmail = signedIn?.email || email;
      const claimPassword = oneTapClaim ? "" : normalizeAuthPassword(password);
      const res = await fetch("/api/join", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          newPlayer
            ? {
                inviteCode,
                email: claimEmail,
                password: claimPassword,
                nickname,
                realName,
              }
            : {
                inviteCode,
                email: claimEmail,
                password: claimPassword,
                membershipId,
                ...(tokenParam ? { inviteToken: tokenParam } : {}),
              }
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
      if (signedIn) {
        afterAuthNavigate("/pick");
        return;
      }
      // Native /api/login POST so Safari keeps the session cookie (same as Sign in).
      submitCredentialsLogin(claimEmail, claimPassword || password, "/pick");
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "network";
      setErr(`Join failed: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  if (viaPersonal && invited?.claimed && !dismissClaimedInvite && !newPlayer) {
    return (
      <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
        <Link href="/" className="text-sm text-gold-400">
          ← Survive Sunday
        </Link>
        <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
          This seat is already claimed
        </h1>
        <div className="card-glass p-5 space-y-4" data-testid="join-seat-claimed">
          <p className="text-sm text-[var(--text-primary)]">
            <strong>{invited.label}</strong> already joined the pool. This
            personal link cannot be used again.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            If that’s you, Sign in with the same email you used when you Joined.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex items-center justify-center w-full"
          >
            Sign in
          </Link>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => setDismissClaimedInvite(true)}
          >
            Not me — pick a different name
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">Join the pool</h1>
      {signedIn && (
        <p
          className="chip chip-gold mb-3 inline-flex"
          role="status"
        >
          You’re signed in — claim with one tap
        </p>
      )}
      {viaPersonal && invited && !invited.claimed && !newPlayer && (
        <p className="chip chip-gold mb-3 inline-flex" role="status" data-testid="join-personal-invite">
          Personal invite for {invited.label}
        </p>
      )}
      {viaPersonal && !invited && !newPlayer && (
        <p className="text-sm text-crimson-400 mb-3" role="status">
          We could not match that personal link to a seat. Pick your name from
          the list, or ask the administrator for a fresh link.
        </p>
      )}
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {newPlayer
          ? "Choose a nickname your friends will recognise. Join once with your email and a password. Stay signed in on this phone."
          : oneTapClaim
            ? `Signed in as ${signedIn?.email}. Pick your name — your Week 1 picks stay.`
            : viaPersonal && invited && !invited.claimed
              ? "Your name is picked. Enter your email and a password — once. Stay signed in on this phone."
              : "Join once with your email and a password. Stay signed in on this phone. Pick your name from the list."}
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
          {viaPersonal && (
            <span className="block mt-1 text-xs text-[var(--text-muted)]">
              Already filled in.
            </span>
          )}
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

        {(newPlayer || (membershipId && !claimed)) && (
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Email</span>
            <input
              type="email"
              value={signedIn?.email || email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={Boolean(signedIn)}
              className="mt-1"
              autoComplete="email"
            />
          </label>
        )}

        {showPassword && (
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">
              {newPlayer
                ? "Password"
                : "Password you already sign in with"}
            </span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1"
              autoComplete="current-password"
            />
            {!newPlayer && (
              <span className="block mt-1 text-xs text-[var(--text-muted)]">
                Same as Sign in — not a new password.
              </span>
            )}
          </label>
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
              : oneTapClaim && selected
                ? `Claim ${selected.nickname} with this login`
                : selected
                  ? `Join as ${selected.nickname}`
                  : "Join pool"}
          </button>
        )}

        {showSignInToClaim && (
          <Link
            href={signInToClaimHref}
            className="btn-secondary inline-flex items-center justify-center w-full"
          >
            I already have this login — Sign in to claim
          </Link>
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
