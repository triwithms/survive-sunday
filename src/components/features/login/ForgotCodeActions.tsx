"use client";

import type { OtpChannel } from "@/lib/otp";
import { otherChannelLabel } from "./forgot-copy";

export function ForgotCodeActions({
  busy,
  codeLen,
  cooldown,
  onResend,
  otherChannel,
  onOther,
}: {
  busy: boolean;
  codeLen: number;
  cooldown: number;
  onResend: () => void;
  otherChannel: OtpChannel | null;
  onOther: () => void;
}) {
  return (
    <>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={busy || codeLen !== 6}
      >
        {busy ? "Saving…" : "Save password and sign in"}
      </button>
      <button
        type="button"
        className="btn-secondary w-full"
        disabled={busy || cooldown > 0}
        onClick={onResend}
      >
        {busy
          ? "Sending…"
          : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend code"}
      </button>
      {otherChannel && (
        <button
          type="button"
          className="w-full text-sm text-gold-400 underline underline-offset-2 min-h-11"
          disabled={busy || cooldown > 0}
          onClick={onOther}
        >
          {otherChannelLabel(otherChannel)}
        </button>
      )}
    </>
  );
}
