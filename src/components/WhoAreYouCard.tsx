"use client";

import { useState } from "react";
import Link from "next/link";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { WhoAreYouSelect } from "@/components/WhoAreYouSelect";

/** Logged-out Real-mode home: pick yourself, then join or sign in. */
export function WhoAreYouCard({ seats }: { seats: ClaimableSeat[] }) {
  const [membershipId, setMembershipId] = useState("");
  const selected = seats.find((s) => s.membershipId === membershipId);
  const claimed = Boolean(selected?.claimed);

  if (seats.length === 0) return null;

  return (
    <div className="card-glass p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gold-400">Who are you?</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Pick your name from the live roster. Join once with your own email
          and password — on this phone you should stay signed in. Or Sign in
          first and claim with one tap. Don’t use Forgot password before you
          Join.
        </p>
      </div>
      <WhoAreYouSelect
        seats={seats}
        value={membershipId}
        onChange={setMembershipId}
        required={false}
        id="home-who-are-you"
      />
      {selected && !claimed && (
        <Link
          href={`/join?seat=${encodeURIComponent(selected.membershipId)}`}
          className="btn-primary inline-flex items-center justify-center w-full"
        >
          That’s me — join as {selected.nickname}
        </Link>
      )}
    </div>
  );
}
