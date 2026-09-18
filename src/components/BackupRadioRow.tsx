"use client";

export const BACKUP_RADIO_CLASS = "mt-1 !h-4 !w-4 !min-h-0 !p-0 shrink-0";

export function BackupRadioRow({
  name,
  checked,
  disabled,
  testId,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  disabled: boolean;
  testId?: string;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm min-h-11 min-w-0 max-w-full">
      <input
        type="radio"
        name={name}
        className={BACKUP_RADIO_CLASS}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-testid={testId}
      />
      <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
        {children}
      </span>
    </label>
  );
}
