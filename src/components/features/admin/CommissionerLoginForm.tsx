"use client";

import { Button } from "@/components/ui";

export function CommissionerLoginForm({
  email,
  password,
  confirm,
  busy,
  err,
  onEmail,
  onPassword,
  onConfirm,
  onSubmit,
}: {
  email: string;
  password: string;
  confirm: string;
  busy: boolean;
  err: string;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onConfirm: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Your real email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          autoComplete="email"
          className="mt-1"
          placeholder="you@example.com"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">New password</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => onPassword(e.target.value)}
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
          onChange={(e) => onConfirm(e.target.value)}
          autoComplete="new-password"
          className="mt-1"
        />
      </label>
      {err ? <p className="text-sm text-crimson-400" role="alert">{err}</p> : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Saving…" : "Save real commissioner login"}
      </Button>
    </form>
  );
}
