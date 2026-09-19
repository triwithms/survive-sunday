import type { NotifyContent } from "./notification-copy";

export function testGameCopy(): NotifyContent {
  const text =
    "This is a sample Survive Sunday game notice. Your Account preference chose how it arrived.";
  return {
    subject: "Survive Sunday — test notice",
    text,
    htmlBody: `<p style="margin:0;">${text}</p>`,
    smsBody: "Survive Sunday test notice. Your Account preference chose this channel.",
  };
}
