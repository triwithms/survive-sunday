"use client";

export function ForgotEmailStep({
  email,
  onEmail,
  onChange,
  info,
  err,
  busy,
}: {
  email: string;
  onEmail: (e: React.FormEvent) => void;
  onChange: (value: string) => void;
  info: string;
  err: string;
  busy: boolean;
}) {
  return (
    <form onSubmit={onEmail} className="space-y-4 card-glass p-5">
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="email"
          className="mt-1"
        />
      </label>
      {info && !err && <p className="text-sm text-field-400">{info}</p>}
      {err && (
        <p className="text-crimson-400 text-sm" role="alert">
          {err}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? "Sending…" : "Send code"}
      </button>
    </form>
  );
}
