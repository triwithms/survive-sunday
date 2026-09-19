import { dispatchNotice } from "./notify-dispatch";
import { notifyInBackground } from "./notify";
import { loadResetNotifyContext } from "./password-reset-admins";
import { resetAdminNotifyCopy } from "./password-reset-notify";

/** BCC-style notify: each admin gets a copy. Never include OTP or password. */
export function notifyAdminsOfResetRequest(
  userId: string,
  email: string
): void {
  notifyInBackground(async () => {
    const { who, admins } = await loadResetNotifyContext(userId, email);
    if (admins.length === 0) return;
    const copy = resetAdminNotifyCopy(who);
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
          type: "password_reset_admin",
          dedupeKey: `reset-admin:${userId}:${stamp}:${admin.id}`,
          content: {
            subject: copy.subject,
            text: copy.text,
            htmlBody: copy.html,
          },
        })
      )
    );
  });
}
