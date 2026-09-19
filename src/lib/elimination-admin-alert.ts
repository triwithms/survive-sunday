import {
  sendResendMessage,
  sendTwilioMessage,
  stadiumEmailHtml,
} from "./delivery";
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

/** Claim new elims, then one email/SMS per Administrator. Safe to re-run. */
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
  const admins = await loadPoolAdminUsers(opts.poolId);
  let emailed = 0;
  let texted = 0;

  for (const admin of admins) {
    const email = normalizeEmail(admin.email ?? "");
    const demo = isDemoEmail(email);
    if (email.includes("@") && !demo) {
      const take = await claimNotificationSend(
        admin.id,
        ADMIN_ELIM_TYPE,
        adminBlastDedupeKey(opts.weekId, ids, "email"),
        "email"
      );
      if (take) {
        const sent = await sendResendMessage({
          to: email,
          subject: copy.subject,
          text: copy.text,
          html: stadiumEmailHtml({
            heading: copy.subject,
            bodyHtml: copy.htmlBody,
          }),
        });
        if (sent.ok) emailed += 1;
      }
    }
    const phone = (admin.phoneE164 ?? "").trim();
    if (phone && !demo) {
      const take = await claimNotificationSend(
        admin.id,
        ADMIN_ELIM_TYPE,
        adminBlastDedupeKey(opts.weekId, ids, "sms"),
        "sms"
      );
      if (take) {
        const sent = await sendTwilioMessage({ to: phone, body: copy.smsBody });
        if (sent.ok) texted += 1;
      }
    }
  }
  return { claimed: ids, emailed, texted };
}
