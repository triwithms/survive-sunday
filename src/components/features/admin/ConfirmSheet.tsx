"use client";

import { Button } from "@/components/ui";
import { usePageScrollLock } from "@/lib/page-scroll-lock";

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
  usePageScrollLock();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/60 overscroll-contain pt-[env(safe-area-inset-top)]"
      data-testid={props.testId}
    >
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
        className="popup-card relative w-full max-h-[min(90dvh,100%)] space-y-3 rounded-t-xl border-t border-stadium-border bg-stadium-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [--popup-bg:var(--stadium-900)] [--popup-pad:1rem]"
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
