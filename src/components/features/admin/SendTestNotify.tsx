"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function SendTestNotify() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function send() {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/notify-test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Could not send");
        return;
      }
      setMsg(typeof data.message === "string" ? data.message : "Sent");
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-glass space-y-2 p-4" data-testid="send-test-notify">
      <h2 className="font-semibold">Notifications</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Sends one sample game notice to you, using your Account preference.
      </p>
      <Button
        className="w-full min-h-11"
        disabled={busy}
        onClick={send}
        data-testid="send-test-notify-btn"
      >
        {busy ? "Sending…" : "Send test to me"}
      </Button>
      {msg ? <p className="text-sm text-gold-400">{msg}</p> : null}
      {err ? <p className="text-sm text-crimson-400">{err}</p> : null}
    </section>
  );
}
