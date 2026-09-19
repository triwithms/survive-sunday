"use server";

import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createHashedInviteToken } from "@/lib/invite-token-db";
import { inviteJoinPath } from "@/lib/invite-token";
import { joinUrl, PUBLIC_APP_ORIGIN } from "@/lib/invite-link";

function appOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  return PUBLIC_APP_ORIGIN;
}

export type IssueInviteResult =
  | { ok: true; url: string; expiresAt: string }
  | { ok: false; error: string; status: number };

export async function issueInviteToken(
  membershipId: string
): Promise<IssueInviteResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "Unauthorized", status: 401 };
  const id = typeof membershipId === "string" ? membershipId.trim() : "";
  if (!id) return { ok: false, error: "Missing seat", status: 400 };

  const seat = await prisma.membership.findUnique({
    where: { id },
    select: { id: true, poolId: true, role: true },
  });
  if (!seat || seat.poolId !== admin.membership.poolId) {
    return { ok: false, error: "Seat not found", status: 404 };
  }
  if (seat.role === "admin") {
    return { ok: false, error: "Administrator seat is not inviteable", status: 400 };
  }

  const minted = await createHashedInviteToken(seat.id);
  return {
    ok: true,
    url: joinUrl(appOrigin(), inviteJoinPath(minted.token)),
    expiresAt: minted.expiresAt.toISOString(),
  };
}
