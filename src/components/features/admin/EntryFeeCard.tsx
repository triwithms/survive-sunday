"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card } from "@/components/ui";

export function EntryFeeCard(props: {
  enabled: boolean;
  entryFeeCents: number | null;
  currency: string;
  instructions: string | null;
  link: string | null;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(props.enabled);
  const [amount, setAmount] = useState(
    props.entryFeeCents == null ? "" : (props.entryFeeCents / 100).toString()
  );
  const [currency, setCurrency] = useState(props.currency || "CAD");
  const [instructions, setInstructions] = useState(props.instructions ?? "");
  const [link, setLink] = useState(props.link ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    const confirmText = enabled
      ? "Save entry fees for this pool? Paid, Unpaid, and Waived stay labels you set by hand. The app never handles money."
      : "Turn off entry fees for this pool? Players will no longer see a status. Nothing already marked is deleted.";
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/entry-fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled,
        entryFee: amount.trim(),
        currency,
        instructions,
        link,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save entry fees.");
      return;
    }
    setMsg(data.summary || "Saved.");
    router.refresh();
  }

  return (
    <Card as="section" className="space-y-3 p-4" data-testid="entry-fee-settings">
      <h2 className="font-semibold">Entry fees</h2>
      <p className="text-sm text-[var(--text-muted)]">
        Optional. Off until you turn it on. This tracks who has paid. The app
        never handles money.
      </p>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 shrink-0 accent-[var(--gold-400,#d4a017)]"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          data-testid="entry-fee-toggle"
        />
        <span>Track entry fees for this pool</span>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">Entry fee amount (optional)</span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="20"
          className="w-full min-h-11 rounded-md border border-stadium-border bg-stadium-800 px-3"
          data-testid="entry-fee-amount"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">Currency</span>
        <input
          value={currency}
          maxLength={3}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          className="w-full min-h-11 rounded-md border border-stadium-border bg-stadium-800 px-3"
          data-testid="entry-fee-currency"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">How to pay</span>
        <textarea
          value={instructions}
          maxLength={280}
          rows={3}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="e-Transfer to name@example.com, message = your nickname"
          className="w-full rounded-md border border-stadium-border bg-stadium-800 px-3 py-2"
          data-testid="entry-fee-instructions"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">Payment link (optional, https)</span>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://"
          className="w-full min-h-11 rounded-md border border-stadium-border bg-stadium-800 px-3"
          data-testid="entry-fee-link"
        />
      </label>
      <Button className="min-h-11 w-full" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save entry fees"}
      </Button>
      {msg ? (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      ) : null}
    </Card>
  );
}
