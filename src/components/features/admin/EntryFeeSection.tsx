"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  markedPaymentLabel,
  paymentStatusLabel,
  type PaymentStatus,
} from "@/lib/payment-tracking";
import { Button } from "@/components/ui";
import { AdminDetails } from "./AdminDetails";

const CHOICES: { id: PaymentStatus; label: string }[] = [
  { id: "unpaid", label: "Unpaid" },
  { id: "paid", label: "Paid" },
  { id: "waived", label: "Waived" },
];

export function EntryFeeSection(props: {
  membershipId: string;
  status: string;
  note: string | null;
  markedAt: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(
    props.status === "paid" || props.status === "waived" ? props.status : "unpaid"
  );
  const [note, setNote] = useState(props.note ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const marked =
    props.markedAt && (props.status === "paid" || props.status === "waived")
      ? markedPaymentLabel(props.status, new Date(props.markedAt))
      : null;

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/entry-fee-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId: props.membershipId, status, note }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error || "Could not save the entry fee.");
      return;
    }
    setMsg(data.summary || "Saved.");
    router.refresh();
  }

  return (
    <AdminDetails
      title="Entry fee"
      summary={paymentStatusLabel(props.status)}
      testId="entry-fee-record"
    >
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">Status</span>
        <select
          className="w-full min-h-11 rounded-md border border-stadium-border bg-stadium-800 px-3"
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          data-testid="entry-fee-status"
        >
          {CHOICES.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-[var(--text-muted)]">Note (only you see this)</span>
        <input
          value={note}
          maxLength={120}
          onChange={(e) => setNote(e.target.value)}
          placeholder="cash at Sunday game"
          className="w-full min-h-11 rounded-md border border-stadium-border bg-stadium-800 px-3"
          data-testid="entry-fee-note"
        />
      </label>
      {marked ? (
        <p className="text-sm text-[var(--text-muted)]" data-testid="entry-fee-marked">
          {marked}
        </p>
      ) : null}
      <Button className="min-h-11 w-full" disabled={busy} onClick={() => void save()}>
        {busy ? "Saving…" : "Save entry fee"}
      </Button>
      {msg ? (
        <p className="text-sm text-field-400" role="status">
          {msg}
        </p>
      ) : null}
    </AdminDetails>
  );
}
