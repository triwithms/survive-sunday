"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { copyText } from "./copy-join";

export function useMissingPick() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  async function send(weekId: string) {
    setBusy(true);
    setNote("");
    setErr("");
    try {
      const res = await fetch("/api/admin/missing-pick-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekId }),
      });
      const data = (await res.json()) as {
        error?: string;
        reminded?: number;
        skipped?: number;
        alreadyPicked?: number;
      };
      if (!res.ok) {
        setErr(data.error || "Could not send");
        return;
      }
      const reminded = data.reminded ?? 0;
      const skipped = data.skipped ?? 0;
      const already = data.alreadyPicked ?? 0;
      setNote(
        `Reminders: ${reminded} sent, ${skipped} skipped, ${already} already picked.`
      );
      router.refresh();
    } catch {
      setErr("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    const ok = await copyText(text);
    setCopied(ok);
    setErr(ok ? "" : "Couldn’t copy — try again");
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  }

  return { busy, note, err, copied, send, copy };
}
