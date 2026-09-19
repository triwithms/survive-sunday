import { A2hsIosHint } from "./A2hsIosHint";
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
          This in-app browser can&apos;t add the icon. Open this link in{" "}
          <strong className="text-[var(--text-primary)]">Safari</strong> first
          (Chrome on Android).
        </p>
        <button type="button" className="btn-primary w-full" onClick={onCopy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </>
    );
  }

  if (variant === "ios") {
    return <A2hsIosHint />;
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
