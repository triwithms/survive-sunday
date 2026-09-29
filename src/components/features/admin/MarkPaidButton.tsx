"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkPaidButton({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function mark() {
    setBusy(true);
    setErr("");
    const res = await fetch("/api/admin/entry-fee-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, status: "paid" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || "Could not mark paid.");
      return;
    }
    router.refresh();
  }

  return (
    <span className="shrink-0">
      <button
        type="button"
        className="min-h-11 px-2 text-xs text-gold-400"
        disabled={busy}
        onClick={() => void mark()}
        data-testid={`mark-paid-${membershipId}`}
      >
        {busy ? "Saving…" : "Mark paid"}
      </button>
      {err ? <span className="block text-xs text-crimson-400">{err}</span> : null}
    </span>
  );
}
