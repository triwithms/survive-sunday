"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { CommissionerEnter, DemoEnter } from "@/components/DemoEnter";
import { friendlyLoginError, loginEmailQueryValue, safeLoginCallbackPath } from "@/lib/login-error";

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  const showDemo = demoMode && params.get("demo") === "1";
  const emailPrefill = loginEmailQueryValue(params.get("email"));
  const err = friendlyLoginError(params.get("error"));
  const callbackUrl = safeLoginCallbackPath(params.get("callbackUrl"));

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-6">Sign in</h1>

      {showDemo && (
        <div className="mb-8">
          <DemoEnter />
        </div>
      )}

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
        onSubmit={() => setBusy(true)}
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
        <p className="text-sm">
          <Link href="/login/forgot" className="text-gold-400">
            Forgot password?
          </Link>
        </p>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          {demoMode
            ? "Google works when AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set. Demo accounts work without Google."
            : "Use the email and password you created. Practice logins no longer work."}
        </p>
      </form>

      {demoMode && !showDemo && (
        <div className="mt-8">
          <DemoEnter />
        </div>
      )}

      <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)] text-center">
        {demoMode && (
          <>
            <p className="text-xs">Managing the pool?</p>
            <div className="flex justify-center">
              <CommissionerEnter />
            </div>
          </>
        )}
        <p>
          Have an invite?{" "}
          <Link href="/join" className="text-gold-400">
            Join the pool
          </Link>
        </p>
      </div>
    </main>
  );
}
