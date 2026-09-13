"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  labelledBy: string;
  /** Soft prompts omit this so backdrop clicks do not dismiss. */
  onBackdropClick?: () => void;
  /** Bottom sheet on phones; centered dialog on larger screens. */
  placement?: "center" | "sheet";
};

/**
 * Viewport-centered dialog, portaled to document.body.
 *
 * Account / phone dialogs live near the sticky header, which uses
 * backdrop-blur. That filter creates a containing block for position:fixed,
 * so an in-tree overlay is clipped to the header. Portal to document.body.
 */
export function ModalDialog({
  children,
  labelledBy,
  onBackdropClick,
  placement = "center",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!mounted) return null;

  const sheet = placement === "sheet";

  return createPortal(
    <div
      className={[
        "fixed inset-0 z-[100] flex justify-center bg-black/60",
        "px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
        sheet ? "items-end sm:items-center" : "items-center",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-testid="modal-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackdropClick?.();
      }}
    >
      <div
        className={[
          "card-glass w-full max-w-sheet max-h-[85dvh] overflow-y-auto p-5 space-y-3",
          sheet ? "rounded-t-2xl sm:rounded-xl" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
