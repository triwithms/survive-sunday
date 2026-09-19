import {
  sendResendMessage,
  sendTwilioMessage,
  stadiumEmailHtml,
} from "./delivery";
import type { NotifyContent } from "./notification-copy";
import { claimNotificationSend, logNotifyOutcome } from "./notify-log";
import { planNotice, type ChannelPlan } from "./notify-plan";
import type { NotifyCategory, NotifyPerson } from "./notify-channels";
import { hydrateNotifyTarget } from "./notify-pref-db";
import type { NotifyChannel } from "./notify-pref";
import {
  withGameEmailDocument,
  withGameEmailHtml,
  withGameEmailText,
  withGameSmsFooter,
} from "./notify-game-footer";

export type DispatchTarget = NotifyPerson & { userId: string };

export type DispatchResult = {
  emailed: boolean;
  texted: boolean;
  skipped: string | null;
  outcomes: ChannelPlan[];
};

export async function dispatchNotice(opts: {
  target: DispatchTarget;
  category: NotifyCategory;
  type: string;
  content: NotifyContent;
  dedupeKey: string;
  requested?: NotifyChannel[];
}): Promise<DispatchResult> {
  const target = await hydrateNotifyTarget(opts.target);
  const plans = planNotice({
    user: target,
    category: opts.category,
    requested: opts.requested,
    type: opts.type,
  });
  let emailed = false;
  let texted = false;
  let skipped: string | null = null;
  for (const plan of plans) {
    const key =
      plan.channel === "none" ? opts.dedupeKey : `${opts.dedupeKey}:${plan.channel}`;
    const claimed = await claimNotificationSend(
      target.userId, opts.type, key, plan.channel, plan.outcome
    );
    if (!claimed) continue;
    logNotifyOutcome({
      userId: target.userId, type: opts.type, channel: plan.channel, outcome: plan.outcome,
    });
    if (plan.outcome !== "sent" || !plan.dest) {
      skipped = skipped ?? plan.outcome;
      continue;
    }
    const ok = await sendPlanned(plan, opts.content, opts.category);
    if (plan.channel === "email") emailed = ok;
    if (plan.channel === "sms") texted = ok;
    if (!ok) skipped = skipped ?? "error";
  }
  if (emailed || texted) skipped = null;
  return { emailed, texted, skipped, outcomes: plans };
}

async function sendPlanned(
  plan: ChannelPlan,
  content: NotifyContent,
  category: NotifyCategory
) {
  if (!plan.dest) return false;
  if (plan.channel === "email") {
    const game = category === "game";
    const text = game ? withGameEmailText(content.text) : content.text;
    const html = content.html
      ? game
        ? withGameEmailDocument(content.html)
        : content.html
      : stadiumEmailHtml({
          heading: content.subject,
          bodyHtml: game ? withGameEmailHtml(content.htmlBody) : content.htmlBody,
        });
    const result = await sendResendMessage({
      to: plan.dest,
      subject: content.subject,
      text,
      html,
    });
    if (!result.ok) console.warn("[notify] email failed", result.error);
    return result.ok;
  }
  const raw = content.smsBody ?? content.text;
  const body = (category === "game" ? withGameSmsFooter(raw) : raw).slice(0, 1500);
  const result = await sendTwilioMessage({ to: plan.dest, body });
  if (!result.ok) console.warn("[notify] SMS failed", result.error);
  return result.ok;
}
