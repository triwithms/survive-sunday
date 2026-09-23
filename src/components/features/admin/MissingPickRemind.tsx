"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { remindConfirmLine, type NoticeCounts } from "@/lib/notice-audience";
import { ConfirmSheet } from "./ConfirmSheet";
import { useMissingPick } from "./use-missing-pick";

export function MissingPickRemind(props: {
  weekId: string;
  plan: NoticeCounts;
  disabled: boolean;
}) {
  const m = useMissingPick();
  const [open, setOpen] = useState(false);
  const once = useRef(false);

  function confirm() {
    if (once.current || m.busy) return;
    once.current = true;
    setOpen(false);
    void m.send(props.weekId);
  }

  return (
    <div className="min-w-0 flex-1 space-y-2">
      <Button
        className="min-h-11 w-full"
        disabled={m.busy || props.disabled}
        onClick={() => {
          once.current = false;
          setOpen(true);
        }}
        data-testid="missing-pick-remind"
      >
        {m.busy ? "Sending…" : "Remind all"}
      </Button>
      {m.note ? (
        <p className="text-sm text-gold-400" role="status">{m.note}</p>
      ) : null}
      {m.err ? <p className="text-sm text-crimson-400">{m.err}</p> : null}
      {open ? (
        <ConfirmSheet
          title="Remind all"
          body={remindConfirmLine(props.plan)}
          confirmLabel="Send"
          busy={m.busy}
          testId="missing-pick-confirm"
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  );
}
