"use client";

export function ForgotCodeActions({
  busy,
  codeLen,
  cooldown,
  onResend,
}: {
  busy: boolean;
  codeLen: number;
  cooldown: number;
  onResend: () => void;
}) {
  return (
    <>
      <button
        type="submit"
        className="btn-primary w-full min-h-14 text-lg"
        disabled={busy || codeLen !== 6}
      >
        {busy ? "Saving…" : "Save password and sign in"}
      </button>
      <button
        type="button"
        className="btn-secondary w-full min-h-14 text-lg"
        disabled={busy || cooldown > 0}
        onClick={onResend}
      >
        {busy
          ? "Sending…"
          : cooldown > 0
            ? `Resend code in ${cooldown}s`
            : "Resend code"}
      </button>
    </>
  );
}
