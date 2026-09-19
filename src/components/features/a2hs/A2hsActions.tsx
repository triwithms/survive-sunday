type Props = {
  onAdded: () => void;
  onLater: () => void;
  onOptOut: () => void;
};

export function A2hsActions({ onAdded, onLater, onOptOut }: Props) {
  return (
    <div className="space-y-2">
      <button type="button" className="btn-secondary w-full" onClick={onAdded}>
        I added it
      </button>
      <button type="button" className="btn-secondary w-full" onClick={onLater}>
        Later
      </button>
      <button
        type="button"
        className="block w-full text-center text-xs text-[var(--text-muted)] underline underline-offset-2 min-h-11"
        onClick={onOptOut}
      >
        Don&apos;t ask again
      </button>
    </div>
  );
}
