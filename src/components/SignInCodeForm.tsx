"use client";

import { useEffect, useRef, useState } from "react";
import { submitCredentialsLogin } from "@/lib/client-auth";
import type { OtpChannel } from "@/lib/otp";

type ChallengeView = {
  channel: OtpChannel;
  destinationMasked: string;
  expiresInSec: number;
  resendAvailableInSec: number;
  canEmail: boolean;
  canSms: boolean;
  stubbed: boolean;
  devCode?: string;
};

function readJson(res: Response): Promise<Record<string, unknown> | null> {
  return res
    .json()
    .then((data) => data as Record<string, unknown>)
    .catch(() => null);
}

export function SignInCodeForm({
  emailPrefill,
  callbackUrl,
}: {
  emailPrefill?: string;
  callbackUrl: string;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(emailPrefill ?? "");
  const [code, setCode] = useState("");
  const [view, setView] = useState<ChallengeView | null>(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sending = useRef(false);

  useEffect(() => {
    if (emailPrefill && !email) setEmail(emailPrefill);
  }, [emailPrefill, email]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendCode(channel?: OtpChannel) {
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setErr("");
    setInfo("");
    try {
      const res = await fetch("/api/login/code", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...(channel ? { channel } : {}) }),
      });
      const data = await readJson(res);
      if (data?.demo === true) {
        setInfo(
          (typeof data.message === "string" && data.message) ||
            "Demo seats always use password demo1234."
        );
        setStep("email");
        return;
      }
      const status = (
        data?.channel ? data : data?.status
      ) as ChallengeView | undefined;
      if (status?.channel && status.destinationMasked) {
        setView((prev) => ({
          ...status,
          devCode: status.devCode ?? prev?.devCode,
        }));
        setCooldown(status.resendAvailableInSec ?? 0);
      }
      if (!res.ok) {
        setErr(
          (typeof data?.error === "string" && data.error) ||
            "Could not send a code. Try again."
        );
        return;
      }
      setStep("code");
      setInfo(
        status?.channel === "sms"
          ? "We texted a 6-digit sign-in code."
          : "We emailed a 6-digit sign-in code."
      );
    } catch {
      setErr("Could not send a code. Check your connection and try again.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  function onEmail(e: React.FormEvent) {
    e.preventDefault();
    void sendCode();
  }

  function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      setErr("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setErr("");
    // Native POST so Safari keeps the session cookie (same as password Sign in).
    submitCredentialsLogin(email, "", callbackUrl, { otp: code });
  }

  const otherChannel: OtpChannel | null = view
    ? view.channel === "sms" && view.canEmail
      ? "email"
      : view.channel === "email" && view.canSms
        ? "sms"
        : null
    : null;

  return (
    <div className="space-y-4" data-testid="signin-code-form">
      {step === "email" ? (
        <form onSubmit={onEmail} className="space-y-4">
          <label className="block text-sm">
            <span className="text-[var(--text-muted)]">Email you Joined with</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1"
            />
          </label>
          {info && !err && <p className="text-sm text-field-400">{info}</p>}
          {err && (
            <p className="text-crimson-400 text-sm" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Email me a sign-in code"}
          </button>
        </form>
      ) : (
        <form onSubmit={onSignIn} className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">
            Code sent to {view?.destinationMasked ?? email}. Expires in about 10
            minutes. This is not a new password — it only signs you in.
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
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="mt-1 text-center font-mono tracking-[0.35em] text-2xl"
              placeholder="000000"
              required
            />
          </label>
          {info && !err && <p className="text-sm text-field-400">{info}</p>}
          {err && (
            <p className="text-crimson-400 text-sm" role="alert">
              {err}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Signing in…" : "Sign in with this code"}
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            disabled={busy || cooldown > 0}
            onClick={() => void sendCode(view?.channel)}
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
              onClick={() => void sendCode(otherChannel)}
            >
              {otherChannel === "sms"
                ? "Text me a code instead"
                : "Email me a code instead"}
            </button>
          )}
        </form>
      )}

      {view?.devCode && (
        <p className="text-xs text-[var(--text-muted)] card-glass p-3">
          Local/dev only — no email/SMS provider configured. Code:{" "}
          <span className="font-mono text-gold-400 text-base tracking-normal">
            {view.devCode.split("").join(" ")}
          </span>
        </p>
      )}
    </div>
  );
}
