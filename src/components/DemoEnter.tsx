"use client";

import { useEffect, useState } from "react";

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
    return "Login hiccup — try Enter as selected again (no password needed).";
  }
  if (code === "NoSession") {
    return "Demo login failed — no session created. Refresh and try again on this same link.";
  }
  return `Demo login failed: ${code}`;
}

/**
 * Native form POST to /api/demo-enter — no client CSRF / fetch.
 * That path sets cookies and redirects on the request Host (works on the tunnel).
 */
export function DemoEnter() {
  const [email, setEmail] = useState(DEMOS[0].email);
  const [err, setErr] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("error");
    if (q) setErr(friendlyError(q));
  }, []);

  return (
    <form className="card-glass p-4 space-y-3" action="/api/demo-enter" method="post">
      <div>
        <p className="text-sm font-semibold text-gold-400">Enter demo pool</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Pick a player to try the pool. No password box — demo password is built in (
          <span className="font-mono text-[var(--text-primary)]">demo1234</span>
          ).
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
      <button type="submit" className="btn-primary w-full">
        Enter as selected
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
  return (
    <form action="/api/demo-enter" method="post" className="space-y-1">
      <input type="hidden" name="email" value={COMMISSIONER.email} />
      <input type="hidden" name="password" value="demo1234" />
      <button
        type="submit"
        className="text-sm text-[var(--text-muted)] underline-offset-2 hover:text-gold-400 hover:underline"
      >
        Enter as commissioner
      </button>
    </form>
  );
}
