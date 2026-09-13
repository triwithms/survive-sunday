"use client";

import Link from "next/link";
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

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [view, setView] = useState<ChallengeView | null>(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sending = useRef(false);

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
      const res = await fetch("/api/password/forgot", {
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
          ? "We texted a 6-digit code."
          : "We emailed a 6-digit code."
      );
    } catch {
      setErr("Could not send a code. Check your connection and try again.");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    await sendCode();
  }

  async function onReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Those passwords don’t match.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setErr(
          (typeof data?.error === "string" && data.error) ||
            "Could not reset that password."
        );
        return;
      }
      submitCredentialsLogin(email, password, "/pool");
      return;
    } catch {
      setErr("Could not finish the reset. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const otherChannel: OtpChannel | null = view
    ? view.channel === "sms" && view.canEmail
      ? "email"
      : view.channel === "email" && view.canSms
        ? "sms"
        : null
    : null;

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/login" className="text-sm text-gold-400">
        ← Back to sign in
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        Forgot password
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        We’ll send a 6-digit code to your email, or a text if you’ve saved a
        cell number. Then you pick a new password. You stay signed in on this
        phone afterwards — no extra code every time you open the app.
      </p>

      {step === "email" ? (
        <form onSubmit={onEmail} className="space-y-4 card-glass p-5">
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
          {info && !err && <p className="text-sm text-field-400">{info}</p>}
          {err && (
            <p className="text-crimson-400 text-sm" role="alert">
              {err}
            </p>
          )}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
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
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
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
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy || code.length !== 6}
          >
            {busy ? "Saving…" : "Save password and sign in"}
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
                ? "Send to my phone instead"
                : "Send to email instead"}
            </button>
          )}
        </form>
      )}

      {view?.devCode && (
        <p className="mt-4 text-xs text-[var(--text-muted)] card-glass p-3">
          Local/dev only — no email/SMS provider configured. Code:{" "}
          <span className="font-mono text-gold-400 text-base tracking-normal">
            {view.devCode.split("").join(" ")}
          </span>
        </p>
      )}
    </main>
  );
}
