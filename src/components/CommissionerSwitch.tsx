"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommissionerSwitch() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function enter() {
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email: "admin@survivesunday.demo",
      password: "demo1234",
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Demo login failed — did you run the seed?");
      return;
    }
    router.push("/admin");
    router.refresh();
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
