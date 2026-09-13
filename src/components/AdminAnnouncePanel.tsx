"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminAnnouncePanel() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function post(url: string, body?: object) {
    setBusy(true);
    setNote("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const data = (await res.json()) as {
        error?: string;
        sent?: number;
        skipped?: number;
        reminded?: number;
      };
      if (!res.ok) {
        setNote(data.error || "Failed");
        return;
      }
      if (typeof data.reminded === "number") {
        setNote(
          `Reminders: ${data.reminded} sent, ${data.skipped ?? 0} skipped (already picked, pref off, or demo).`
        );
      } else {
        setNote(
          `Note sent to ${data.sent ?? 0} friend(s). ${data.skipped ?? 0} skipped (pref off or demo).`
        );
        setMessage("");
      }
      router.refresh();
    } catch {
      setNote("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-glass p-4 space-y-3">
      <h2 className="font-semibold">Pool notes & reminders</h2>
      <p className="text-xs text-[var(--text-muted)]">
        Emails go only to friends who left <strong>Pool notes</strong> or{" "}
        <strong>Missing pick reminder</strong> on in Account → Notification
        preferences. Practice @survivesunday.demo seats are never emailed.
      </p>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Note to the pool</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={800}
          rows={4}
          disabled={busy}
          className="mt-1 w-full min-h-[6rem]"
          placeholder="e.g. Week 1 lock is Thursday. Check your pick."
        />
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={busy || !message.trim()}
          onClick={() => void post("/api/admin/announce", { message })}
        >
          {busy ? "Sending…" : "Send pool note"}
        </button>
        <button
          type="button"
          className="btn-secondary flex-1"
          disabled={busy}
          onClick={() => void post("/api/admin/missing-pick-reminders")}
        >
          Nudge missing picks
        </button>
      </div>
      {note && (
        <p className="text-sm text-[var(--text-muted)]" role="status">
          {note}
        </p>
      )}
    </section>
  );
}
