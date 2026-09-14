"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CommissionerEnter, DemoEnter } from "@/components/DemoEnter";
import { SignInCodeForm } from "@/components/SignInCodeForm";
import { friendlyLoginError, loginEmailQueryValue, safeLoginCallbackPath } from "@/lib/login-error";
import { markAddToHomePending } from "@/lib/pwa-install";

function preferPasswordForm(error: string | null): boolean {
  return error === "CredentialsSignin" || error === "MissingFields";
}

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const params = useSearchParams();
  const errCode = params.get("error");
  const [busy, setBusy] = useState(false);
  const [codePath, setCodePath] = useState(() => !preferPasswordForm(errCode));
  const showDemo = demoMode && params.get("demo") === "1";
  const emailPrefill = loginEmailQueryValue(params.get("email"));
  const err = friendlyLoginError(errCode);
  const callbackUrl = safeLoginCallbackPath(params.get("callbackUrl"));

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">Sign in</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Join once. On this phone you stay signed in.
      </p>

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

      {codePath ? (
        <div className="card-glass p-5 space-y-4">
          <SignInCodeForm emailPrefill={emailPrefill} callbackUrl={callbackUrl} />
          <button
            type="button"
            className="w-full text-sm text-[var(--text-muted)] underline underline-offset-2 min-h-11"
            onClick={() => setCodePath(false)}
          >
            Use password instead
          </button>
        </div>
      ) : (
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
          <button
            type="button"
            className="w-full text-sm text-gold-400 underline underline-offset-2 min-h-11"
            onClick={() => setCodePath(true)}
          >
            Email me a sign-in code
          </button>
          <p className="text-sm text-center">
            <Link href="/login/forgot" className="text-[var(--text-muted)] underline underline-offset-2">
              Forgot password?
            </Link>
          </p>
        </form>
      )}

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
