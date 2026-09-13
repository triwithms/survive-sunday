"use client";

import type { ClaimableSeat } from "@/lib/claim-seat";
import { CLAIM_ERRORS } from "@/lib/claim-seat";
import Link from "next/link";

export function seatOptionLabel(seat: ClaimableSeat): string {
  return seat.claimed ? `${seat.label} — already claimed` : seat.label;
}

export function WhoAreYouSelect({
  seats,
  value,
  onChange,
  disabled,
  required = true,
  id = "who-are-you",
}: {
  seats: ClaimableSeat[];
  value: string;
  onChange: (membershipId: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}) {
  const selected = seats.find((s) => s.membershipId === value);

  return (
    <div className="space-y-2">
      <label className="block text-sm" htmlFor={id}>
        <span className="text-[var(--text-muted)]">Who are you?</span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="mt-1"
          aria-label="Who are you?"
        >
          <option value="">Pick your name…</option>
          {seats.map((seat) => (
            <option key={seat.membershipId} value={seat.membershipId}>
              {seatOptionLabel(seat)}
            </option>
          ))}
        </select>
      </label>
      {selected?.claimed && (
        <p className="text-sm text-crimson-400" role="status">
          {CLAIM_ERRORS.alreadyClaimed}{" "}
          <Link href="/login" className="text-gold-400 underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
