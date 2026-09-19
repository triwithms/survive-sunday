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
          Open in{" "}
          <strong className="text-[var(--text-primary)]">Safari</strong> or{" "}
          <strong className="text-[var(--text-primary)]">Chrome</strong> to add
          Survive Sunday to your Home Screen. This in-app browser can&apos;t.
        </p>
        <button type="button" className="btn-primary w-full" onClick={onCopy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </>
    );
  }

  if (variant === "ios") {
    return (
      <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-muted)]">
        <li>
          Tap Share <ShareGlyph />
        </li>
        <li>
          Tap{" "}
          <strong className="text-[var(--text-primary)]">
            Add to Home Screen
          </strong>
        </li>
        <li>
          Tap <strong className="text-[var(--text-primary)]">Add</strong>
        </li>
      </ol>
    );
  }

  return (
    <>
      <p className="text-sm text-[var(--text-muted)]">
        Install Survive Sunday so it opens like an app and stays signed in.
      </p>
      {canPrompt ? (
        <button type="button" className="btn-primary w-full" onClick={onInstall}>
          Install
        </button>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          Chrome menu (⋮) →{" "}
          <strong className="text-[var(--text-primary)]">Install app</strong> or{" "}
          <strong className="text-[var(--text-primary)]">
            Add to Home screen
          </strong>
          .
        </p>
      )}
    </>
  );
}
