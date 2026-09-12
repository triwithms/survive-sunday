"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

async function enterDemo(
  email: string,
  setErr: (msg: string) => void
): Promise<boolean> {
  try {
    const res = await signInCredentials(email, "demo1234");
    if (!res.ok) {
      const code = res.error || "";
      if (code === "CredentialsSignin") {
        setErr("Demo login failed — wrong password or seed not run (npm run seed).");
      } else if (/csrf/i.test(code)) {
        setErr(
          "CSRF check failed on this host. Refresh and try again (tunnel + localhost need AUTH_TRUST_HOST)."
        );
      } else if (code === "NoSession") {
        setErr("Demo login failed — no session created. Check AUTH_SECRET / seed.");
      } else {
        setErr(`Demo login failed: ${code}`);
      }
      return false;
    }
    return true;
  } catch {
    setErr(
      "Demo login failed (network/CSRF). Try again, or open the app on the same host you started from (localhost vs tunnel)."
    );
    return false;
  }
}

export function DemoEnter() {
  const [email, setEmail] = useState(DEMOS[0].email);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function enter() {
    setBusy(true);
    setErr("");
    const ok = await enterDemo(email, setErr);
    if (ok) {
      router.refresh();
      afterAuthNavigate("/pool");
    }
    setBusy(false);
  }

  return (
    <div className="card-glass p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gold-400">Enter demo pool</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Pick a player to try the pool. Password for all:{" "}
          <span className="font-mono text-[var(--text-primary)]">demo1234</span>
        </p>
      </div>
      <select
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
      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy}
        onClick={enter}
      >
        {busy ? "Signing in…" : "Enter as selected"}
      </button>
      {err && <p className="text-crimson-400 text-sm">{err}</p>}
    </div>
  );
}

/** Small secondary control — commissioner is not a landing CTA. */
export function CommissionerEnter() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function enter() {
    setBusy(true);
    setErr("");
    const ok = await enterDemo(COMMISSIONER.email, setErr);
    if (ok) {
      router.refresh();
      afterAuthNavigate("/pool");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={busy}
        onClick={enter}
        className="text-sm text-[var(--text-muted)] underline-offset-2 hover:text-gold-400 hover:underline disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Enter as commissioner"}
      </button>
      {err && <p className="text-crimson-400 text-xs">{err}</p>}
    </div>
  );
}
