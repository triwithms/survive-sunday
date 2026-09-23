"use client";

import { Button } from "@/components/ui";

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  busy?: boolean;
  testId?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
};

export function ConfirmSheet(props: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" data-testid={props.testId}>
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cancel"
        onClick={props.onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        className="relative w-full space-y-3 rounded-t-xl border-t border-stadium-border bg-stadium-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <h2 id="confirm-sheet-title" className="text-sm font-semibold">
          {props.title}
        </h2>
        <p className="text-sm">{props.body}</p>
        {props.children}
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="min-h-11"
            disabled={props.busy}
            onClick={props.onConfirm}
            data-testid="confirm-sheet-ok"
          >
            {props.confirmLabel}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11"
            disabled={props.busy}
            onClick={props.onCancel}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
