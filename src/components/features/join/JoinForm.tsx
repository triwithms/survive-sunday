"use client";

import Link from "next/link";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { JoinClaimedSeat } from "./JoinClaimedSeat";
import { JoinFields } from "./JoinFields";
import { joinLead, joinSubmitLabel } from "./join-copy";
import { useJoinForm } from "./use-join-form";

export function JoinForm({
  seats,
  signedIn,
  tokenSeatId,
}: {
  seats: ClaimableSeat[];
  signedIn?: { email: string; userId: string } | null;
  tokenSeatId?: string | null;
}) {
  const j = useJoinForm({ seats, signedIn, tokenSeatId });

  if (j.showClaimed && j.invited) {
    return <JoinClaimedSeat label={j.invited.label} />;
  }

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        Join the pool
      </h1>
      {j.viaPersonal && j.invited && !j.invited.claimed && !j.newPlayer && (
        <p
          className="chip chip-gold mb-3 inline-flex"
          role="status"
          data-testid="join-personal-invite"
        >
          Personal invite for {j.invited.label}
        </p>
      )}
      <p className="text-[var(--text-muted)] text-sm mb-6">
        {joinLead({
          newPlayer: j.newPlayer,
          viaPersonal: j.viaPersonal,
          invitedLabel: j.invited?.label,
          claimed: j.claimed,
        })}
      </p>
      <form onSubmit={j.onSubmit} className="space-y-4 card-glass p-5">
        <JoinFields
          viaPersonal={j.viaPersonal}
          newPlayer={j.newPlayer}
          showPassword={j.showPassword}
          lockEmail={j.lockEmail}
          inviteCode={j.inviteCode}
          setInviteCode={j.setInviteCode}
          nickname={j.nickname}
          setNickname={j.setNickname}
          realName={j.realName}
          setRealName={j.setRealName}
          email={j.email}
          setEmail={j.setEmail}
          password={j.password}
          setPassword={j.setPassword}
        />
        {j.err && (
          <p className="text-crimson-400 text-sm" role="alert">
            {j.err}
          </p>
        )}
        {j.canSubmit && (
          <button type="submit" className="btn-primary w-full" disabled={j.busy}>
            {joinSubmitLabel(j.busy, j.selected?.nickname)}
          </button>
        )}
        {j.showSignInToClaim && (
          <Link
            href={j.signInToClaimHref}
            className="btn-secondary inline-flex items-center justify-center w-full"
          >
            I already have this login — Sign in to claim
          </Link>
        )}
        <p className="text-xs text-[var(--text-muted)]">
          Already have a password?{" "}
          <Link href="/login" className="text-gold-400">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
