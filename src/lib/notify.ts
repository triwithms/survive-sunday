import { prisma } from "./db";
import {
  sendResendMessage,
  sendTwilioMessage,
  stadiumEmailHtml,
} from "./delivery";
import { getNotificationPrefs } from "./notification-prefs";
import {
  shouldSendMissingPickSms,
  shouldSendPoolEmail,
  type NotificationType,
} from "./notification-types";
import type { NotifyContent } from "./notification-copy";

export type { NotifyContent };
export {
  announcementCopy,
  missingPickCopy,
  pickConfirmedCopy,
  resultsCopy,
  scoreUpdateCopy,
} from "./notification-copy";

export type NotifyTarget = {
  userId: string;
  email?: string | null;
  phoneE164?: string | null;
  nickname?: string | null;
};

async function claimSend(
  userId: string,
  type: NotificationType,
  dedupeKey: string,
  channel: string
): Promise<boolean> {
  try {
    await prisma.notificationSend.create({
      data: { userId, type, dedupeKey, channel },
    });
    return true;
  } catch {
    return false;
  }
}

export async function notifyUser(opts: {
  target: NotifyTarget;
  type: NotificationType;
  content: NotifyContent;
  dedupeKey: string;
  /** SMS only when the type is missing-pick and a cell is saved. */
  alsoSms?: boolean;
}): Promise<{ emailed: boolean; texted: boolean; skipped: string | null }> {
  try {
    const prefs = await getNotificationPrefs(opts.target.userId);
    const emailGate = shouldSendPoolEmail({
      email: opts.target.email,
      prefs,
      type: opts.type,
    });
    let emailed = false;
    if (emailGate.send) {
      const claimed = await claimSend(
        opts.target.userId,
        opts.type,
        `${opts.dedupeKey}:email`,
        "email"
      );
      if (claimed) {
        const result = await sendResendMessage({
          to: opts.target.email!.trim(),
          subject: opts.content.subject,
          text: opts.content.text,
          html: stadiumEmailHtml({
            heading: opts.content.subject,
            bodyHtml: opts.content.htmlBody,
          }),
        });
        emailed = result.ok;
        if (!result.ok) {
          console.warn("[notify] email failed", result.error);
        }
      }
    }

    let texted = false;
    if (opts.alsoSms) {
      const smsGate = shouldSendMissingPickSms({
        phoneE164: opts.target.phoneE164,
        prefs,
      });
      if (smsGate.send && opts.content.smsBody) {
        const claimed = await claimSend(
          opts.target.userId,
          opts.type,
          `${opts.dedupeKey}:sms`,
          "sms"
        );
        if (claimed) {
          const result = await sendTwilioMessage({
            to: opts.target.phoneE164!.trim(),
            body: opts.content.smsBody,
          });
          texted = result.ok;
          if (!result.ok) {
            console.warn("[notify] SMS failed", result.error);
          }
        }
      } else if (!smsGate.send && smsGate.reason === "pref-off") {
        return {
          emailed,
          texted: false,
          skipped: emailed ? null : "pref-off",
        };
      }
    }

    if (!emailed && !texted) {
      return { emailed, texted, skipped: emailGate.reason };
    }
    return { emailed, texted, skipped: null };
  } catch (error) {
    console.error("[notify] failed", error);
    return { emailed: false, texted: false, skipped: "error" };
  }
}

/** Never throw — pick / grade paths must stay reliable. */
export function notifyInBackground(task: () => Promise<unknown>): void {
  void task().catch((error) => {
    console.error("[notify] background failed", error);
  });
}
