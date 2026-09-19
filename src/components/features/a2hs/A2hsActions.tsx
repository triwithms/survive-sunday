type Props = {
  onAdded: () => void;
  onLater: () => void;
  onOptOut: () => void;
};

export function A2hsActions({ onAdded, onLater, onOptOut }: Props) {
  const link =
    "block w-full text-center text-sm text-[var(--text-muted)] underline underline-offset-2 min-h-11";
  return (
    <div className="space-y-1">
      <button type="button" className={link} onClick={onLater}>
        Later
      </button>
      <button type="button" className={link} onClick={onAdded}>
        I added it
      </button>
      <button type="button" className={link} onClick={onOptOut}>
        Don&apos;t ask again
      </button>
    </div>
  );
}
