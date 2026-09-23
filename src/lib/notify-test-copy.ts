import type { NotifyContent } from "./notification-copy";

/** GSM-7 only, no emoji: must stay one trial segment. */
export const ADMIN_TEST_SMS =
  "Survive Sunday ADMIN TEST only. Checking that your notify channel works. Not a real pool alert.";

export function testGameCopy(): NotifyContent {
  const lead = "ADMIN TEST only. Checking that your notify channel works.";
  const detail =
    "This is not a real pool alert. No pick, result, or deadline changed. It came from Admin → System → Send test to me, and your Account preference chose how it arrived.";
  return {
    subject: "Survive Sunday ADMIN TEST — channel check, not a real pool alert",
    text: `${lead}\n\n${detail}`,
    htmlBody: `<p style="margin:0 0 12px;font-weight:bold;color:#e8c547;">${lead}</p><p style="margin:0;">${detail}</p>`,
    smsBody: ADMIN_TEST_SMS,
  };
}
