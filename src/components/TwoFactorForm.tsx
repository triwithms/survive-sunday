"use client";

import { useEffect, useRef, useState } from "react";
import { afterAuthNavigate } from "@/lib/client-auth";
import type { TwoFactorChannel } from "@/lib/two-factor";

type ChallengeView = {
  channel: TwoFactorChannel;
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

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  const data = await readJson(res);
  return typeof data?.csrfToken === "string" ? data.csrfToken : "";
}

export function TwoFactorForm({ email }: { email?: string | null }) {
  const [view, setView] = useState<ChallengeView | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const sentOnce = useRef(false);

  useEffect(() => {
    if (sentOnce.current) return;
    sentOnce.current = true;
    void sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function sendCode(channel?: TwoFactorChannel) {
    setSending(true);
    setErr("");
    setInfo("");
    try {
      const res = await fetch("/api/2fa/send", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channel ? { channel } : {}),
      });
      const data = await readJson(res);
      const status = (
        data?.channel
          ? data
          : data?.status
      ) as ChallengeView | undefined;
      if (status?.channel && status.destinationMasked) {
        applyView(status);
      }
      if (!res.ok) {
        setErr(
          (typeof data?.error === "string" && data.error) ||
            "Could not send a code. Try again."
        );
        return;
      }
      setInfo(
        status?.channel === "sms"
          ? "We texted a 6-digit code."
          : "We emailed a 6-digit code."
      );
    } catch {
      setErr("Could not send a code. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  function applyView(next: ChallengeView) {
    setView(next);
    setCooldown(next.resendAvailableInSec ?? 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await readJson(res);
      if (!res.ok) {
        setErr(
          (typeof data?.error === "string" && data.error) ||
            "That code is wrong or expired."
        );
        return;
      }
      afterAuthNavigate("/pool");
    } catch {
      setErr("Could not check that code. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    try {
      const csrf = await getCsrfToken();
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "same-origin",
        redirect: "manual",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({ csrfToken: csrf, callbackUrl: "/login" }),
      });
    } catch {
      /* still leave */
    }
    afterAuthNavigate("/login");
  }

  const otherChannel: TwoFactorChannel | null = view
    ? view.channel === "sms" && view.canEmail
      ? "email"
      : view.channel === "email" && view.canSms
        ? "sms"
        : null
    : null;

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <button
        type="button"
        onClick={cancel}
        className="text-sm text-gold-400"
      >
        ← Back to sign in
      </button>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        Check your {view?.channel === "sms" ? "texts" : "email"}
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        We sent a 6-digit sign-in code
        {view ? ` to ${view.destinationMasked}` : email ? ` to ${email}` : ""}.
        It expires in about 10 minutes.
      </p>

      <form onSubmit={onSubmit} className="space-y-4 card-glass p-5">
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
        {info && !err && (
          <p className="text-sm text-field-400">{info}</p>
        )}
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
          {busy ? "Checking…" : "Continue"}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={sending || cooldown > 0}
          onClick={() => void sendCode(view?.channel)}
        >
          {sending
            ? "Sending…"
            : cooldown > 0
              ? `Resend code in ${cooldown}s`
              : "Resend code"}
        </button>
        {otherChannel && (
          <button
            type="button"
            className="w-full text-sm text-gold-400 underline underline-offset-2 min-h-11"
            disabled={sending || cooldown > 0}
            onClick={() => void sendCode(otherChannel)}
          >
            {otherChannel === "sms" ? "Send to my phone instead" : "Send to email instead"}
          </button>
        )}
      </form>

      {view?.devCode && (
        <p className="mt-4 text-xs text-[var(--text-muted)] card-glass p-3">
          Local/dev only — no email/SMS provider configured. Code:{" "}
          <span className="font-mono text-gold-400 tracking-widest">{view.devCode}</span>
        </p>
      )}
    </main>
  );
}
