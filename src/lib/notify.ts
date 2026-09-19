import { dispatchNotice, type DispatchTarget } from "./notify-dispatch";
import type { NotifyContent } from "./notification-copy";
import type { NotificationType } from "./notification-types";

export type { NotifyContent };
export {
  announcementCopy,
  missingPickCopy,
  pickConfirmedCopy,
  resultsCopy,
  scoreUpdateCopy,
} from "./notification-copy";
export { claimNotificationSend } from "./notify-log";

export type NotifyTarget = DispatchTarget & {
  nickname?: string | null;
};

export async function notifyUser(opts: {
  target: NotifyTarget;
  type: NotificationType;
  content: NotifyContent;
  dedupeKey: string;
}): Promise<{ emailed: boolean; texted: boolean; skipped: string | null }> {
  if (opts.type === "scoreUpdates" || opts.type === "injuryNotes") {
    return { emailed: false, texted: false, skipped: "noisy-off" };
  }
  try {
    return await dispatchNotice({
      target: opts.target,
      category: "game",
      type: opts.type,
      content: opts.content,
      dedupeKey: opts.dedupeKey,
    });
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
