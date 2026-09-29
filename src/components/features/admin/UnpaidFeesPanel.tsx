"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { remindConfirmLine, type NoticeCounts } from "@/lib/notice-audience";
import { Button, Card } from "@/components/ui";
import { ConfirmSheet } from "./ConfirmSheet";

export function UnpaidFeesPanel(props: { count: number; plan: NoticeCounts }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const once = useRef(false);

  async function send() {
    if (once.current || busy) return;
    once.current = true;
    setOpen(false);
    setBusy(true);
    setNote("");
    setErr("");
    try {
      const res = await fetch("/api/admin/entry-fee-reminders", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        reminded?: number;
        skipped?: number;
      };
      if (!res.ok) {
        setErr(data.error || "Could not send");
        return;
      }
      setNote(`Reminders: ${data.reminded ?? 0} sent, ${data.skipped ?? 0} skipped.`);
      router.refresh();
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      as="section"
      id="unpaid-entry-fees"
      className="space-y-3 p-4"
      data-testid="unpaid-entry-fees"
    >
      <div>
        <h2 className="font-semibold">Unpaid entry fees ({props.count})</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Friends still marked Unpaid. Paid and waived are skipped. Send uses
          each person’s pool-notes preference. No amount goes in a text.
        </p>
      </div>
      <Button
        className="min-h-11 w-full"
        disabled={busy || props.count === 0}
        onClick={() => {
          once.current = false;
          setOpen(true);
        }}
        data-testid="remind-unpaid"
      >
        {busy ? "Sending…" : "Remind unpaid"}
      </Button>
      {note ? (
        <p className="text-sm text-gold-400" role="status">
          {note}
        </p>
      ) : null}
      {err ? <p className="text-sm text-crimson-400">{err}</p> : null}
      {open ? (
        <ConfirmSheet
          title="Remind unpaid"
          body={remindConfirmLine(props.plan)}
          confirmLabel="Send"
          busy={busy}
          testId="remind-unpaid-confirm"
          onCancel={() => setOpen(false)}
          onConfirm={() => void send()}
        />
      ) : null}
    </Card>
  );
}
