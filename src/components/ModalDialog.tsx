"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  labelledBy: string;
  /** Soft prompts omit this so backdrop clicks do not dismiss. */
  onBackdropClick?: () => void;
};

/**
 * Viewport-centered dialog, portaled to document.body.
 *
 * PhoneEditor / NicknameEditor live inside the sticky header, which uses
 * backdrop-blur. That filter creates a containing block for position:fixed,
 * so an in-tree overlay is clipped to the header (only Skip/Save showed).
 */
export function ModalDialog({ children, labelledBy, onBackdropClick }: Props) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      data-testid="modal-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackdropClick?.();
      }}
    >
      <div className="card-glass w-full max-w-sheet max-h-[min(36rem,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] overflow-y-auto p-5 space-y-3">
        {children}
      </div>
    </div>,
    document.body
  );
}
