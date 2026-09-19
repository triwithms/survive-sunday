import { isDemoRecipient } from "./notification-types";
import {
  contactFor,
  resolveChannels,
  type NotifyCategory,
  type NotifyPerson,
} from "./notify-channels";
import { modeBlock } from "./notify-mode";
import type { NotifyChannel } from "./notify-pref";

export const NOTIFY_OUTCOMES = [
  "sent",
  "skipped_pref",
  "no_contact",
  "dry_run",
] as const;
export type NotifyOutcome = (typeof NOTIFY_OUTCOMES)[number];

export type ChannelPlan = {
  channel: NotifyChannel | "none";
  outcome: NotifyOutcome;
  dest?: string;
};

export function planNotice(opts: {
  user: NotifyPerson;
  category: NotifyCategory;
  requested?: NotifyChannel[];
  env?: Record<string, string | undefined>;
}): ChannelPlan[] {
  const wanted = resolveChannels(opts.user, opts.category, opts.requested);
  if (wanted.length === 0) {
    return [{ channel: "none", outcome: "skipped_pref" }];
  }
  const env = opts.env ?? process.env;
  const plans: ChannelPlan[] = [];
  for (const channel of wanted) {
    const dest = contactFor(opts.user, channel);
    if (!dest) {
      plans.push({ channel, outcome: "no_contact" });
      continue;
    }
    if (channel === "email" && isDemoRecipient(dest) && opts.category !== "security") {
      plans.push({ channel, outcome: "no_contact", dest });
      continue;
    }
    const blocked = modeBlock(opts.category, dest, env);
    if (blocked) {
      plans.push({ channel, outcome: blocked, dest });
      continue;
    }
    plans.push({ channel, outcome: "sent", dest });
  }
  return plans;
}
