"use client";

import { ForgotCodeActions } from "./ForgotCodeActions";
import type { ForgotCodeStepProps } from "./forgot-code-props";

export function ForgotCodeStep({
  email, view, code, setCode, password, setPassword, confirm, setConfirm,
  info, err, busy, cooldown, onReset, onResend, otherChannel,
}: ForgotCodeStepProps) {
  return (
    <form onSubmit={onReset} className="space-y-4 card-glass p-5">
      <p className="text-sm text-[var(--text-muted)]">
        Code sent to {view?.destinationMasked ?? email}. Expires in about 10
        minutes.
      </p>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">One-time code</span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1 text-center font-mono tracking-[0.35em] text-2xl"
          placeholder="000000"
          required
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">New password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          className="mt-1"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Confirm password</span>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="mt-1"
        />
      </label>
      {info && !err && <p className="text-sm text-field-400">{info}</p>}
      {err && (
        <p className="text-crimson-400 text-sm" role="alert">
          {err}
        </p>
      )}
      <ForgotCodeActions
        busy={busy}
        codeLen={code.length}
        cooldown={cooldown}
        onResend={() => onResend(view?.channel)}
        otherChannel={otherChannel}
        onOther={() => otherChannel && onResend(otherChannel)}
      />
    </form>
  );
}
