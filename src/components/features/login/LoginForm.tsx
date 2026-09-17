"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  friendlyLoginError,
  loginEmailQueryValue,
  safeLoginCallbackPath,
} from "@/lib/login-error";
import { markAddToHomePending } from "@/lib/pwa-install";

export function LoginForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const emailPrefill = loginEmailQueryValue(params.get("email"));
  const err = friendlyLoginError(params.get("error"));
  const callbackUrl = safeLoginCallbackPath(params.get("callbackUrl"));

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-6">Sign in</h1>

      {err && (
        <p
          className="mb-4 card-glass p-4 text-crimson-400 text-sm font-medium"
          role="alert"
          data-testid="login-error"
        >
          {err}
        </p>
      )}

      <form
        action="/api/login"
        method="post"
        className="space-y-4 card-glass p-5"
        onSubmit={() => {
          markAddToHomePending();
          setBusy(true);
        }}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Email</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={emailPrefill}
            autoComplete="email"
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Password</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-1"
          />
        </label>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-center">
          <Link
            href="/login/forgot"
            className="text-[var(--text-muted)] underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </p>
      </form>
    </main>
  );
}
