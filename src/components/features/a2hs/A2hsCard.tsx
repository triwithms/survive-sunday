import { A2hsActions } from "./A2hsActions";
import { A2hsCopy } from "./A2hsCopy";
import type { A2hsVariant } from "./env";

type Props = {
  variant: A2hsVariant;
  canPrompt: boolean;
  copied: boolean;
  onInstall: () => void;
  onCopy: () => void;
  onAdded: () => void;
  onLater: () => void;
  onOptOut: () => void;
};

export function A2hsCard({
  variant,
  canPrompt,
  copied,
  onInstall,
  onCopy,
  onAdded,
  onLater,
  onOptOut,
}: Props) {
  return (
    <aside
      data-testid="a2hs-nudge"
      role="region"
      aria-label="Add to Home Screen"
      className="fixed inset-x-0 z-50 mx-auto max-w-pool px-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="card-glass space-y-3 border border-stadium-border p-4 shadow-lg">
        <A2hsCopy
          variant={variant}
          canPrompt={canPrompt}
          copied={copied}
          onInstall={onInstall}
          onCopy={onCopy}
        />
        <A2hsActions
          onAdded={onAdded}
          onLater={onLater}
          onOptOut={onOptOut}
        />
      </div>
    </aside>
  );
}
