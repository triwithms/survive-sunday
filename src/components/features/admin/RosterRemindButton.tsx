"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { remindConfirmLine, type NoticeCounts } from "@/lib/notice-audience";
import { ConfirmSheet } from "./ConfirmSheet";

export function RosterRemindButton(props: {
  membershipId: string;
  nickname: string;
  plan: NoticeCounts;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const once = useRef(false);

  async function send() {
    if (once.current) return;
    once.current = true;
    setOpen(false);
    setBusy(true);
    setNote("");
    setErr("");
    try {
      const res = await fetch("/api/admin/missing-pick-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId: props.membershipId }),
      });
      const data = (await res.json()) as {
        error?: string;
        reminded?: number;
        skipped?: number;
      };
      if (!res.ok) {
        once.current = false;
        setErr(data.error || "Could not send");
        return;
      }
      const reminded = data.reminded ?? 0;
      setNote(
        reminded > 0
          ? `Reminder sent to ${props.nickname}.`
          : `No reminder sent (${data.skipped ?? 0} skipped).`
      );
    } catch {
      once.current = false;
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <Button
        variant="secondary"
        className="min-h-11 w-full"
        disabled={busy}
        onClick={() => {
          once.current = false;
          setOpen(true);
        }}
        data-testid="roster-remind"
      >
        Remind
      </Button>
      {note ? (
        <p className="mt-1 text-xs text-gold-400" role="status">{note}</p>
      ) : null}
      {err ? (
        <p className="mt-1 text-xs text-crimson-400" role="alert">{err}</p>
      ) : null}
      {open ? (
        <ConfirmSheet
          title={`Remind ${props.nickname}`}
          body={remindConfirmLine(props.plan)}
          confirmLabel="Send"
          busy={busy}
          testId="roster-remind-confirm"
          onCancel={() => setOpen(false)}
          onConfirm={() => void send()}
        />
      ) : null}
    </div>
  );
}
