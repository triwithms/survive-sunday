type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  maxLength?: number;
  inputMode?: "tel" | "text" | "numeric";
  placeholder?: string;
};

export function ProfileField({
  label,
  value,
  onChange,
  autoComplete,
  maxLength,
  inputMode,
  placeholder,
}: Props) {
  return (
    <label className="block text-sm">
      <span className="text-[var(--text-muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        maxLength={maxLength}
        className="mt-1"
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
      />
    </label>
  );
}
