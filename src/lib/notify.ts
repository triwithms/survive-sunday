import { prisma } from "./db";
import { sendEmail, sendSms } from "./message-delivery";
import {
  type NotificationPrefs,
  type NotificationType,
  mergeNotificationPrefs,
  shouldSendMessage,
} from "./notification-prefs";
import { isDemoEmail } from "./pool-mode";
export {
  mulliganEliminatedCopy,
  pickConfirmedCopy,
  resultsGradedCopy,
} from "./notify-copy";

export type NotifyResult =
  | { sent: false; skipped: true; reason: string }
  | {
      sent: true;
      skipped: false;
      email?: { ok: boolean; stubbed?: boolean };
      sms?: { ok: boolean; stubbed?: boolean };
    };

export type NotifyPayload = {
  membershipId: string;
  type: NotificationType;
  subject: string;
  text: string;
  html?: string;
  smsBody?: string;
  prefs?: NotificationPrefs | null;
};

/**
 * Gate + deliver a pool notification. Never throws to the caller’s await
 * if used via notifyMembershipSafe. Password reset must keep using
 * deliverOtp() — it does not call this.
 */
export async function deliverPoolNotification(
  payload: NotifyPayload
): Promise<NotifyResult> {
  const membership = await prisma.membership.findUnique({
    where: { id: payload.membershipId },
    include: {
      user: {
        select: { email: true, phoneE164: true },
      },
      notificationPreference: true,
    },
  });
  if (!membership) {
    return { sent: false, skipped: true, reason: "no-membership" };
  }

  const prefs =
    payload.prefs ?? mergeNotificationPrefs(membership.notificationPreference);
  if (!shouldSendMessage({ type: payload.type, prefs })) {
    return { sent: false, skipped: true, reason: "pref-off" };
  }

  const email = membership.user.email?.trim() ?? "";
  const phone = membership.user.phoneE164?.trim() ?? "";
  const smsBody = payload.smsBody ?? payload.text;
  const result: Extract<NotifyResult, { sent: true }> = {
    sent: true,
    skipped: false,
  };

  const canEmail = Boolean(email) && !isDemoEmail(email);
  if (canEmail) {
    const delivered = await sendEmail({
      to: email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    result.email = {
      ok: delivered.ok,
      stubbed: delivered.ok ? delivered.stubbed : false,
    };
  }

  if (phone) {
    const delivered = await sendSms({ to: phone, body: smsBody });
    result.sms = {
      ok: delivered.ok,
      stubbed: delivered.ok ? delivered.stubbed : false,
    };
  }

  if (!result.email && !result.sms) {
    return { sent: false, skipped: true, reason: "no-destination" };
  }
  return result;
}

/** Fire-and-forget wrapper so picks / grading / Join never fail on mail. */
export function notifyMembershipSafe(payload: NotifyPayload): void {
  void deliverPoolNotification(payload).catch((error) => {
    console.error("[notify] failed", payload.type, payload.membershipId, error);
  });
}
