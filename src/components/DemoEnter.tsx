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

export function DemoEnter() {
  const [email, setEmail] = useState(DEMOS[0].email);
  const [busy, setBusy] = useState<"commissioner" | "selected" | null>(null);
  const [err, setErr] = useState("");
  const router = useRouter();

  async function enter(nextEmail: string, button: "commissioner" | "selected") {
    setBusy(button);
    setErr("");
    try {
      const res = await signInCredentials(nextEmail, "demo1234");
      if (!res.ok) {
        const code = res.error || "";
        if (code === "CredentialsSignin") {
          setErr("Demo login failed — wrong password or seed not run (npm run seed).");
        } else if (/csrf/i.test(code)) {
          setErr("CSRF check failed on this host. Refresh and try again (tunnel + localhost need AUTH_TRUST_HOST).");
        } else if (code === "NoSession") {
          setErr("Demo login failed — no session created. Check AUTH_SECRET / seed.");
        } else {
          setErr(`Demo login failed: ${code}`);
        }
        return;
      }
      // Invalidate RSC cache, then hard-navigate so /pick cannot reuse Aurora.
      router.refresh();
      afterAuthNavigate("/pool");
    } catch {
      setErr(
        "Demo login failed (network/CSRF). Try again, or open the app on the same host you started from (localhost vs tunnel)."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card-glass p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gold-400">Enter demo pool</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Want to manage the pool? Use the commissioner demo.
        </p>
      </div>
      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy !== null}
        onClick={() => enter(COMMISSIONER.email, "commissioner")}
      >
        {busy === "commissioner" ? "Signing in…" : "Enter as commissioner"}
      </button>
      <p className="text-xs text-[var(--text-muted)]">
        Switch accounts to test pick privacy. Password for all:{" "}
        <span className="font-mono text-[var(--text-primary)]">demo1234</span>
      </p>
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
        className="btn-secondary w-full"
        disabled={busy !== null}
        onClick={() => enter(email, "selected")}
      >
        {busy === "selected" ? "Signing in…" : "Enter as selected"}
      </button>
      {err && <p className="text-crimson-400 text-sm">{err}</p>}
    </div>
  );
}
