"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { CommissionerEnter, DemoEnter } from "@/components/DemoEnter";
import { afterAuthNavigate, signInCredentials } from "@/lib/client-auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const showDemo = params.get("demo") === "1";
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await signInCredentials(email, password);
      if (!res.ok) {
        setErr(
          res.error === "CredentialsSignin"
            ? "Invalid email or password"
            : res.error === "NoSession"
              ? "Sign-in failed — no session created."
              : `Sign-in failed: ${res.error}`
        );
        return;
      }
      router.refresh();
      afterAuthNavigate("/pool");
    } catch {
      setErr("Sign-in failed (network/CSRF). Refresh and try again on this same host.");
    } finally {
      setBusy(false);
    }
  }

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

      <form onSubmit={onSubmit} className="space-y-4 card-glass p-5">
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--text-muted)]">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1"
          />
        </label>
        {err && <p className="text-crimson-400 text-sm">{err}</p>}
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
          onClick={() => signIn("google", { callbackUrl: "/pool" })}
        >
          Continue with Google
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Google works when AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET are set. Demo
          accounts work without Google.
        </p>
      </form>

      {!showDemo && (
        <div className="mt-8">
          <DemoEnter />
        </div>
      )}

      <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)] text-center">
        <p className="text-xs">Managing the pool?</p>
        <div className="flex justify-center">
          <CommissionerEnter />
        </div>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
