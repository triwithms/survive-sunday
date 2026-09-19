import { ShareGlyph } from "./ShareGlyph";
import type { A2hsVariant } from "./env";

type Props = {
  variant: A2hsVariant;
  canPrompt: boolean;
  copied: boolean;
  onInstall: () => void;
  onCopy: () => void;
};

export function A2hsCopy({
  variant,
  canPrompt,
  copied,
  onInstall,
  onCopy,
}: Props) {
  if (variant === "inapp") {
    return (
      <>
        <p className="text-sm text-[var(--text-muted)]">
          Open this link in Safari or Chrome to add NFL Pool to your Home
          Screen.
        </p>
        <button type="button" className="btn-primary w-full" onClick={onCopy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </>
    );
  }

  if (variant === "ios") {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        <strong className="text-[var(--text-primary)]">
          Share <ShareGlyph /> → Add to Home Screen
        </strong>
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-[var(--text-muted)]">
        Add NFL Pool to your Home Screen.
      </p>
      {canPrompt ? (
        <button type="button" className="btn-primary w-full" onClick={onInstall}>
          Install
        </button>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Chrome menu (⋮) →{" "}
          <strong className="text-[var(--text-primary)]">Install app</strong>
        </p>
      )}
    </>
  );
}
