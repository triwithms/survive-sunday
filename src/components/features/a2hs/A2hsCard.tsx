import { ModalDialog } from "@/components/ModalDialog";
import { A2hsCopy } from "./A2hsCopy";
import type { A2hsVariant } from "./env";

type Props = {
  variant: A2hsVariant;
  canPrompt: boolean;
  copied: boolean;
  yesMode: boolean;
  onYes: () => void;
  onNo: () => void;
  onNotNow: () => void;
  onInstall: () => void;
  onCopy: () => void;
  onClose: () => void;
};

export function A2hsCard({
  variant,
  canPrompt,
  copied,
  yesMode,
  onYes,
  onNo,
  onNotNow,
  onInstall,
  onCopy,
  onClose,
}: Props) {
  if (yesMode) {
    return (
      <ModalDialog
        labelledBy="a2hs-yes-title"
        placement="sheet"
        onBackdropClick={onClose}
      >
        <div className="flex items-start justify-between gap-3" data-testid="a2hs-nudge">
          <h2 id="a2hs-yes-title" className="font-display text-lg text-gold-400">
            Add to Home Screen
          </h2>
          <button
            type="button"
            className="text-sm text-gold-400 min-h-11 px-2"
            data-testid="a2hs-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <A2hsCopy
          variant={variant}
          canPrompt={canPrompt}
          copied={copied}
          onInstall={onInstall}
          onCopy={onCopy}
        />
        <button
          type="button"
          className="btn-secondary w-full min-h-14 text-lg"
          data-testid="a2hs-done"
          onClick={onClose}
        >
          Done
        </button>
      </ModalDialog>
    );
  }

  return (
    <aside
      data-testid="a2hs-nudge"
      role="region"
      aria-label="Add to Home Screen"
      className="fixed inset-x-0 z-50 mx-auto max-w-pool px-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="card-glass space-y-3 border border-stadium-border p-4 shadow-lg">
        <p className="text-base text-[var(--text-primary)]">
          Do you want to add NFL Pool to your Home Screen?
        </p>
        <button type="button" className="btn-primary w-full min-h-14 text-lg" onClick={onYes}>
          Yes
        </button>
        <button type="button" className="btn-secondary w-full min-h-14 text-lg" onClick={onNo}>
          No — don’t ask again
        </button>
        <button type="button" className="btn-secondary w-full min-h-14 text-lg" onClick={onNotNow}>
          Not now
        </button>
      </div>
    </aside>
  );
}
