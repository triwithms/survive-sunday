import "server-only";
import { prisma } from "./db";
import { peekInviteToken } from "./invite-token-db";
import { isDemoEmail } from "./pool-mode";
import { safeInvitePrefill, type InvitePrefill } from "./invite-prefill";

export async function loadInvitePrefill(
  token: string
): Promise<InvitePrefill | null> {
  const row = await peekInviteToken(token);
  if (!row) return null;
  const seat = await prisma.membership.findUnique({
    where: { id: row.membershipId },
    select: { nickname: true, user: { select: { email: true } } },
  });
  if (!seat) return null;
  const email = (seat.user.email ?? "").trim();
  return safeInvitePrefill({
    email: email && !isDemoEmail(email) ? email : "",
    nickname: seat.nickname,
  });
}
