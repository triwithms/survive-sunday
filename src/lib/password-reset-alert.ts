import { sendResendMessage } from "./delivery";
import { notifyInBackground } from "./notify";
import { loadResetNotifyContext } from "./password-reset-admins";
import { resetAdminNotifyCopy } from "./password-reset-notify";

/** BCC-style notify: each admin gets a copy. Never include OTP or password. */
export function notifyAdminsOfResetRequest(
  userId: string,
  email: string
): void {
  notifyInBackground(async () => {
    const { who, adminEmails } = await loadResetNotifyContext(userId, email);
    if (adminEmails.length === 0) return;
    const copy = resetAdminNotifyCopy(who);
    await Promise.all(
      adminEmails.map((to) =>
        sendResendMessage({
          to,
          subject: copy.subject,
          text: copy.text,
          html: copy.html,
        })
      )
    );
  });
}
