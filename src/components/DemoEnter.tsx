"use client";

import { useEffect, useState } from "react";
import { afterAuthNavigate, signInCredentials } from "@/lib/client-auth";

const COMMISSIONER = {
  email: "admin@survivesunday.demo",
  label: "Commissioner (admin)",
};

const DEMOS = [
  { email: "aurora@survivesunday.demo", label: "Aurora (undefeated)" },
  { email: "frost@survivesunday.demo", label: "Frost (undefeated)" },
  { email: "ember@survivesunday.demo", label: "Ember (one loss)" },
  { email: "jasper@survivesunday.demo", label: "Jasper (no pick yet)" },
  { email: "harbor@survivesunday.demo", label: "Harbor (eliminated)" },
];

function friendlyError(code: string): string {
  if (code === "CredentialsSignin") {
    return "Demo login failed — wrong password or seed not run (npm run seed).";
  }
  if (/csrf/i.test(code)) {
    return "CSRF check failed on this host. Refresh and try again.";
  }
  if (code === "NoSession") {
    return "Demo login failed — no session created. Refresh and try again on this same link.";
  }
  if (/network|failed to fetch|load failed/i.test(code)) {
    return `Demo login failed (network). Stay on this page’s link — not localhost. (${code})`;
  }
  return `Demo login failed: ${code}`;
}

async function enterViaFetch(email: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/demo-enter", {
    method: "POST",
    credentials: "same-origin",
    redirect: "manual",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: "demo1234" }),
  });
  if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
    return { ok: true };
  }
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    next?: string;
  };
  if (res.ok && data.ok) return { ok: true };
  return { ok: false, error: data.error || `HTTP ${res.status}` };
}

export function DemoEnter() {
  const [email, setEmail] = useState(DEMOS[0].email);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("error");
    if (q) setErr(friendlyError(q));
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      let result = await enterViaFetch(email);
      if (!result.ok) {
        result = await signInCredentials(email, "demo1234");
      }
      if (!result.ok) {
        setErr(friendlyError(result.error || "unknown"));
        return;
      }
      afterAuthNavigate("/pool");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "network";
      setErr(friendlyError(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="card-glass p-4 space-y-3"
      action="/api/demo-enter"
      method="post"
      onSubmit={onSubmit}
    >
      <div>
        <p className="text-sm font-semibold text-gold-400">Enter demo pool</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Pick a player to try the pool. Password for all:{" "}
          <span className="font-mono text-[var(--text-primary)]">demo1234</span>
        </p>
      </div>
      <select
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Demo account"
      >
        {DEMOS.map((d) => (
          <option key={d.email} value={d.email}>
            {d.label}
          </option>
        ))}
      </select>
      <input type="hidden" name="password" value="demo1234" />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Signing in…" : "Enter as selected"}
      </button>
      {err && (
        <p className="text-crimson-400 text-sm" role="alert">
          {err}
        </p>
      )}
    </form>
  );
}

/** Small secondary control — commissioner is not a landing CTA. */
export function CommissionerEnter() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      let result = await enterViaFetch(COMMISSIONER.email);
      if (!result.ok) {
        result = await signInCredentials(COMMISSIONER.email, "demo1234");
      }
      if (!result.ok) {
        setErr(friendlyError(result.error || "unknown"));
        return;
      }
      afterAuthNavigate("/pool");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "network";
      setErr(friendlyError(msg));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form action="/api/demo-enter" method="post" onSubmit={onSubmit} className="space-y-1">
      <input type="hidden" name="email" value={COMMISSIONER.email} />
      <input type="hidden" name="password" value="demo1234" />
      <button
        type="submit"
        disabled={busy}
        className="text-sm text-[var(--text-muted)] underline-offset-2 hover:text-gold-400 hover:underline disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Enter as commissioner"}
      </button>
      {err && (
        <p className="text-crimson-400 text-xs" role="alert">
          {err}
        </p>
      )}
    </form>
  );
}
