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
}: Props) {
  return (
    <aside
      data-testid="a2hs-nudge"
      role="region"
      aria-label="Add to Home Screen"
      className="fixed inset-x-0 z-50 mx-auto max-w-pool px-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="card-glass space-y-3 border border-stadium-border p-4 shadow-lg">
        {yesMode ? (
          <A2hsCopy
            variant={variant}
            canPrompt={canPrompt}
            copied={copied}
            onInstall={onInstall}
            onCopy={onCopy}
          />
        ) : (
          <>
            <p className="text-base text-[var(--text-primary)]">
              Do you want to add NFL Pool to your Home Screen?
            </p>
            <button type="button" className="btn-primary w-full min-h-14 text-lg" onClick={onYes}>
              Yes
            </button>
            <button type="button" className="btn-secondary w-full min-h-14 text-lg" onClick={onNo}>
              No
            </button>
            <button type="button" className="btn-secondary w-full min-h-14 text-lg" onClick={onNotNow}>
              Not now
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
