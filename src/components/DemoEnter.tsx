"use client";

import { useEffect, useState } from "react";

const COMMISSIONER = {
  email: "admin@survivesunday.demo",
  label: "Commissioner (admin)",
};

/** BM Boys 26/27 — default seat is Gams (Robert). */
const DEMOS = [
  { email: "gams@survivesunday.demo", label: "Gams — Robert Gama (you)" },
  { email: "black-cobra@survivesunday.demo", label: "Black Cobra — Justin John" },
  { email: "cannoli-stuffer@survivesunday.demo", label: "Cannoli Stuffer — Michael Frigo" },
  { email: "colin@survivesunday.demo", label: "Colin — Colin Malone" },
  { email: "daddy-chill@survivesunday.demo", label: "Daddy Chill — Joachim Kuzel" },
  { email: "deep-and-delicious@survivesunday.demo", label: "Deep and Delicious — Kent Richmond" },
  { email: "gdogss@survivesunday.demo", label: "Gdogss — Tony Gyuro" },
  { email: "jimmyc@survivesunday.demo", label: "JimmyC — Jim Coulson" },
  { email: "long-snapper@survivesunday.demo", label: "Long Snapper — J S" },
  { email: "steve@survivesunday.demo", label: "Steve — Steve" },
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
  if (code === "CallbackRouteError" || code === "Configuration") {
    return "Demo login failed — database lookup threw during sign-in. Refresh and try again.";
  }
  if (code === "DatabaseUnavailable") {
    return "Demo login failed — the pool database is not reachable. Check DATABASE_URL and seed.";
  }
  return `Demo login failed: ${code}`;
}

/**
 * Native form POST to /api/demo-enter — no client CSRF / fetch.
 * The route calls Auth.js signIn then next/navigation redirect() so the
 * session cookie is kept (a hand-built 303 was dropping it).
 * Uncontrolled select (defaultValue) so SSR HTML and hydration always match;
 * a controlled value= was unnecessary for native POST and could toast on
 * stale SW chunks after landing copy/roster changes.
 */
export function DemoEnter() {
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
          Pick a BM Boys player to try the pool. No password box — demo password is built in (
          <span className="font-mono text-[var(--text-primary)]">demo1234</span>
          ).
        </p>
      </div>
      <select
        name="email"
        defaultValue={DEMOS[0].email}
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
