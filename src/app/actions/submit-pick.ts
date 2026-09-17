"use server";

import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { isPoolParticipant } from "@/lib/pool-rules";
import { submitPickForMembership } from "@/lib/pick-submit";
import type { SubmitPickResult } from "@/lib/pick-submit";

export type { SubmitPickResult };

export async function submitPick(
  weekNumber: number,
  teamAbbr: string
): Promise<SubmitPickResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized", status: 401 };
  }
  const membership = await getMembershipForUser(session.user.id);
  if (!membership) {
    return { ok: false, error: "Not in a pool", status: 403 };
  }
  if (membership.status === "eliminated") {
    return { ok: false, error: "Eliminated — no picks", status: 403 };
  }
  if (!isPoolParticipant(membership)) {
    return {
      ok: false,
      error: "Commissioner is not a participant — no pick required",
      status: 403,
    };
  }
  if (
    !Number.isFinite(Number(weekNumber)) ||
    typeof teamAbbr !== "string" ||
    !teamAbbr
  ) {
    return { ok: false, error: "Invalid pick", status: 400 };
  }
  return submitPickForMembership({
    membership,
    weekNumber: Number(weekNumber),
    teamAbbr,
  });
}
