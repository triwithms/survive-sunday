import type { ClaimableSeat } from "@/lib/claim-seat";
import {
  arrivedViaPersonalInvite,
  resolveSeatFromInvite,
} from "@/lib/invite-link";
import { isDemoEmail } from "@/lib/pool-mode";

export function joinInviteFromParams(args: {
  seats: ClaimableSeat[];
  tokenSeatId?: string | null;
  tokenParam: string;
  seatParam: string;
  whoParam: string;
  signedInEmail?: string | null;
}) {
  const invited = resolveSeatFromInvite(args.seats, {
    seat: args.seatParam,
    who: args.whoParam,
  });
  const viaPersonal =
    arrivedViaPersonalInvite({ seat: args.seatParam, who: args.whoParam }) ||
    Boolean(args.tokenParam || args.tokenSeatId);
  const initialSeat =
    args.tokenSeatId ||
    (invited && !invited.claimed ? invited.membershipId : "");
  const sessionEmail =
    args.signedInEmail && !isDemoEmail(args.signedInEmail)
      ? args.signedInEmail
      : "";
  return { invited, viaPersonal, initialSeat, sessionEmail };
}

export function joinSignInHref(membershipId: string): string {
  const next = membershipId
    ? `/join?seat=${encodeURIComponent(membershipId)}`
    : "/join";
  return `/login?callbackUrl=${encodeURIComponent(next)}`;
}
