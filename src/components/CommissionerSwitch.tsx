"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { afterAuthNavigate, signInCredentials } from "@/lib/client-auth";

export function CommissionerSwitch() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function enter() {
    setBusy(true);
    setError("");
    try {
      const res = await signInCredentials(
        "admin@survivesunday.demo",
        "demo1234"
      );
      if (!res.ok) {
        setError("Demo login failed — did you run the seed?");
        return;
      }
      router.refresh();
      afterAuthNavigate("/admin");
    } catch {
      setError("Demo login failed — did you run the seed?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={enter}>
        {busy ? "Signing in…" : "Switch to Commissioner demo"}
      </button>
      {error && <p className="text-crimson-400 text-sm">{error}</p>}
    </div>
  );
}
