"use client";

import { useState } from "react";
import { FEEDBACK_MAX_LEN } from "@/lib/feedback-admin-copy";

export function ReportBugForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo("");
    setErr("");
    try {
      const res = await fetch("/api/account/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Couldn’t send that. Try again.");
        return;
      }
      setInfo(
        typeof data.message === "string"
          ? data.message
          : "Thanks — we sent your note to the Administrators."
      );
      setMessage("");
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card-glass space-y-3 p-4" onSubmit={(e) => void send(e)}>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Your note</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={FEEDBACK_MAX_LEN}
          rows={6}
          disabled={busy}
          className="mt-1 w-full min-h-[8rem]"
          placeholder="What went wrong, or what would you like to see?"
          data-testid="account-report-message"
        />
      </label>
      <button
        type="submit"
        className="btn-primary w-full min-h-11"
        disabled={busy || !message.trim()}
        data-testid="account-report-send"
      >
        {busy ? "Sending…" : "Send report"}
      </button>
      {info ? (
        <p className="text-sm text-gold-400" role="status" data-testid="account-report-ok">
          {info}
        </p>
      ) : null}
      {err ? (
        <p className="text-sm text-crimson-400" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  );
}
