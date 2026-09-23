"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { wrapConfirmLine, type NoticeCounts } from "@/lib/notice-audience";
import { ConfirmSheet } from "./ConfirmSheet";

export function WeekWrapSend(props: {
  weekNumber: number;
  audience: NoticeCounts;
  busy: boolean;
  onSend: () => void;
}) {
  const [open, setOpen] = useState(false);
  const once = useRef(false);
  const names = props.audience.nicknames;

  function confirm() {
    if (once.current || props.busy) return;
    once.current = true;
    setOpen(false);
    props.onSend();
  }

  return (
    <>
      <Button
        className="w-full min-h-11"
        disabled={props.busy}
        onClick={() => {
          once.current = false;
          setOpen(true);
        }}
        data-testid="week-wrap-send"
      >
        {props.busy ? "Sending…" : "Send now"}
      </Button>
      {open ? (
        <ConfirmSheet
          title={`Week ${props.weekNumber} wrap`}
          body={wrapConfirmLine(props.weekNumber, props.audience)}
          confirmLabel="Send now"
          busy={props.busy}
          testId="week-wrap-confirm"
          onCancel={() => setOpen(false)}
          onConfirm={confirm}
        >
          <details>
            <summary className="min-h-11 cursor-pointer text-sm">
              Who gets this ({names.length})
            </summary>
            {names.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No one is set to receive it.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {names.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            )}
          </details>
        </ConfirmSheet>
      ) : null}
    </>
  );
}
