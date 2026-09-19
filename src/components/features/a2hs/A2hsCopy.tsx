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
        <p className="text-sm text-[var(--text-muted)]">Open in Safari first.</p>
        <button type="button" className="btn-primary w-full" onClick={onCopy}>
          {copied ? "Link copied" : "Copy link"}
        </button>
      </>
    );
  }
  if (variant === "ios") return <A2hsIosHint />;
  if (canPrompt) {
    return (
      <button type="button" className="btn-primary w-full" onClick={onInstall}>
        Install
      </button>
    );
  }
  return (
    <p className="text-sm text-[var(--text-muted)]">
      Chrome (⋮) → <strong className="text-[var(--text-primary)]">Install</strong>
    </p>
  );
}
