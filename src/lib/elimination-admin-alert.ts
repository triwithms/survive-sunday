import { dispatchNotice } from "./notify-dispatch";
import { isDemoEmail, normalizeEmail } from "./otp";
import { claimNotificationSend, notifyInBackground } from "./notify";
import { loadPoolAdminUsers } from "./password-reset-admins";
import {
  adminBlastDedupeKey,
  eliminationAdminCopy,
  eliminationEventDedupeKey,
  type EliminatedPlayer,
} from "./elimination-admin-copy";

const ADMIN_ELIM_TYPE = "eliminationMulligan";

export function scheduleAdminEliminationNotice(opts: {
  poolId: string;
  weekId: string;
  weekNumber: number;
  eliminated: EliminatedPlayer[];
}): void {
  if (opts.eliminated.length === 0) return;
  notifyInBackground(() => deliverAdminEliminationNotice(opts));
}

/** Claim new elims, then notify each Administrator via their own prefs. */
export async function deliverAdminEliminationNotice(opts: {
  poolId: string;
  weekId: string;
  weekNumber: number;
  eliminated: EliminatedPlayer[];
}): Promise<{ claimed: string[]; emailed: number; texted: number }> {
  const claimed: EliminatedPlayer[] = [];
  for (const person of opts.eliminated) {
    const ok = await claimNotificationSend(
      person.userId,
      ADMIN_ELIM_TYPE,
      eliminationEventDedupeKey(opts.weekId, person.membershipId),
      "admin"
    );
    if (ok) claimed.push(person);
  }
  if (claimed.length === 0) return { claimed: [], emailed: 0, texted: 0 };

  const copy = eliminationAdminCopy({
    weekNumber: opts.weekNumber,
    nicknames: claimed.map((p) => p.nickname),
  });
  const ids = claimed.map((p) => p.membershipId);
  const blastKey = adminBlastDedupeKey(opts.weekId, ids, "email").replace(
    /:email$/,
    ""
  );
  let emailed = 0;
  let texted = 0;
  for (const admin of await loadPoolAdminUsers(opts.poolId)) {
    const demo = isDemoEmail(normalizeEmail(admin.email ?? ""));
    if (demo) continue;
    const result = await dispatchNotice({
      target: {
        userId: admin.id,
        email: admin.email,
        phoneE164: admin.phoneE164,
        notifyPref: admin.notifyPref,
      },
      category: "admin_alert",
      type: ADMIN_ELIM_TYPE,
      dedupeKey: blastKey,
      content: copy,
    });
    if (result.emailed) emailed += 1;
    if (result.texted) texted += 1;
  }
  return { claimed: ids, emailed, texted };
}
