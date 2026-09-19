import { dispatchNotice } from "./notify-dispatch";
import { loadResetNotifyContext } from "./password-reset-admins";
import { feedbackAdminNotifyCopy } from "./feedback-admin-copy";

/** Same multi-admin union as password-reset / elimination. One copy each. */
export async function deliverFeedbackAdminNotice(opts: {
  userId: string;
  email: string;
  message: string;
}): Promise<{ notified: number }> {
  const { who, admins } = await loadResetNotifyContext(opts.userId, opts.email);
  if (admins.length === 0) return { notified: 0 };
  const copy = feedbackAdminNotifyCopy(who, opts.message, opts.email);
  const stamp = Date.now();
  await Promise.all(
    admins.map((admin) =>
      dispatchNotice({
        target: {
          userId: admin.id,
          email: admin.email,
          phoneE164: admin.phoneE164,
          notifyPref: admin.notifyPref,
        },
        category: "admin_alert",
        type: "bug_report_admin",
        dedupeKey: `feedback-admin:${opts.userId}:${stamp}:${admin.id}`,
        content: copy,
      })
    )
  );
  return { notified: admins.length };
}
