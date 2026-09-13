import { isDemoEmail } from "./pool-mode";

export const CLAIM_PASSWORD_MIN = 6;

export const CLAIM_ERRORS = {
  missingFields: "Enter the invite code, your email, and a password.",
  invalidInvite: "That invite code is not right. Ask the commissioner for SUNDAY26.",
  poolMissing: "Pool not found — run seed",
  demoEmail: "Use your own email to join — not a practice address.",
  passwordShort: `Password must be at least ${CLAIM_PASSWORD_MIN} characters.`,
  seatMissing: "We could not find that person. Refresh and pick again.",
  commissionerSeat: "The commissioner is not a player seat. Pick your own name, or ask the commissioner.",
  alreadyClaimed:
    "This seat is already claimed. Sign in instead, or ask the commissioner if that’s you.",
  emailTaken: "That email already has an account. Sign in instead, or pick a different email.",
  emailOnOtherSeat:
    "That email is already on another player seat. Sign in instead, or pick a different email.",
  emailPasswordMismatch:
    "That email already has an account. Use the password you already sign in with (your commissioner login), not a new one. Or Sign in first, then come back to Join and claim with one tap.",
  alreadyInPool: "Already in this pool",
  alreadyCommissioner:
    "This email is already the commissioner login. Pick your player name from the list (for example Gams) and use that same password.",
  nicknameTaken: "Nickname already taken in this pool",
} as const;

export type ClaimableSeat = {
  membershipId: string;
  nickname: string;
  realName: string | null;
  claimed: boolean;
  label: string;
};

export type SeatMemberRow = {
  id: string;
  nickname: string;
  realName: string | null;
  role: string;
  user: { email: string | null };
};

export type EmailOwnerInfo = {
  id: string;
  hasPlayerSeat: boolean;
  hasAdminSeat: boolean;
};

export type ClaimDecision =
  | { ok: true; action: "convert-practice" | "attach-to-existing"; userId: string }
  | { ok: false; status: number; error: string };

/**
 * Practice @survivesunday.demo seats are still claimable.
 * Any other email means someone already attached a real login.
 */
export function isSeatClaimed(email: string | null | undefined): boolean {
  if (!email) return false;
  return !isDemoEmail(email);
}

export function formatSeatLabel(
  nickname: string,
  realName: string | null | undefined
): string {
  const nick = nickname.trim();
  const real = (realName ?? "").trim();
  if (real && real.toLowerCase() !== nick.toLowerCase()) {
    return `${nick} (${real})`;
  }
  return nick;
}

export function seatsFromMemberships(members: SeatMemberRow[]): ClaimableSeat[] {
  return members
    .filter((m) => m.role !== "admin")
    .slice()
    .sort((a, b) => a.nickname.localeCompare(b.nickname, "en-CA"))
    .map((m) => ({
      membershipId: m.id,
      nickname: m.nickname,
      realName: m.realName,
      claimed: isSeatClaimed(m.user.email),
      label: formatSeatLabel(m.nickname, m.realName),
    }));
}

/**
 * Decide whether a picked roster seat can take this email.
 * Does not write to the database.
 */
export function decideClaim(args: {
  seat: { role: string; userId: string; email: string | null } | null;
  newEmail: string;
  emailOwner: EmailOwnerInfo | null;
}): ClaimDecision {
  if (!args.seat) {
    return { ok: false, status: 404, error: CLAIM_ERRORS.seatMissing };
  }
  if (args.seat.role === "admin") {
    return { ok: false, status: 400, error: CLAIM_ERRORS.commissionerSeat };
  }
  if (isSeatClaimed(args.seat.email)) {
    return { ok: false, status: 409, error: CLAIM_ERRORS.alreadyClaimed };
  }
  if (isDemoEmail(args.newEmail)) {
    return { ok: false, status: 400, error: CLAIM_ERRORS.demoEmail };
  }
  if (args.emailOwner && args.emailOwner.id !== args.seat.userId) {
    if (args.emailOwner.hasPlayerSeat) {
      return { ok: false, status: 409, error: CLAIM_ERRORS.emailOnOtherSeat };
    }
    // Commissioner (or any login with no player seat) can attach this seat.
    return {
      ok: true,
      action: "attach-to-existing",
      userId: args.emailOwner.id,
    };
  }
  return { ok: true, action: "convert-practice", userId: args.seat.userId };
}
