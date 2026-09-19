"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  friendlyLoginError,
  loginEmailQueryValue,
  safeLoginCallbackPath,
} from "@/lib/login-error";
import { markAddToHomePending } from "@/components/features/a2hs/actions";

export function LoginForm() {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const emailPrefill = loginEmailQueryValue(params.get("email"));
  const err = friendlyLoginError(params.get("error"));
  const callbackUrl = safeLoginCallbackPath(params.get("callbackUrl"));

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-5 py-16">
      <h1 className="font-display text-4xl text-gold-400 mb-10">Sign in</h1>
      {err && (
        <p
          className="mb-5 text-crimson-400 text-base font-medium"
          role="alert"
          data-testid="login-error"
        >
          {err}
        </p>
      )}
      <form
        action="/api/login"
        method="post"
        className="space-y-6"
        onSubmit={() => {
          markAddToHomePending();
          setBusy(true);
        }}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <label className="block text-base">
          <span className="text-[var(--text-primary)]">Email or username</span>
          <input
            type="text"
            name="email"
            required
            defaultValue={emailPrefill}
            autoComplete="username"
            inputMode="email"
            className="mt-2 min-h-14 text-lg"
          />
        </label>
        <label className="block text-base">
          <span className="text-[var(--text-primary)]">Password</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-2 min-h-14 text-lg"
          />
        </label>
        <button
          type="submit"
          className="btn-primary w-full min-h-14 text-lg"
          disabled={busy}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-center">
          <Link
            href="/login/forgot"
            className="text-[var(--text-muted)] underline underline-offset-2 min-h-12 inline-flex items-center text-base"
          >
            Forgot password?
          </Link>
        </p>
      </form>
    </main>
  );
}
