"use client";

export function NotifyMasterToggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-1 rounded-xl border border-stadium-border bg-stadium-800 p-1"
      data-testid="notify-master"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        aria-pressed={value}
        className={`min-h-11 rounded-lg px-2 text-sm font-semibold ${
          value
            ? "bg-gold-400 text-[var(--text-inverse)]"
            : "text-[var(--text-muted)]"
        }`}
      >
        On
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        aria-pressed={!value}
        className={`min-h-11 rounded-lg px-2 text-sm font-semibold ${
          !value
            ? "bg-gold-400 text-[var(--text-inverse)]"
            : "text-[var(--text-muted)]"
        }`}
      >
        Off
      </button>
    </div>
  );
}
