"use client";

type JoinFieldsProps = {
  lockEmail: boolean;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
};

/** Personal invite only. No invite-code box and no public nickname form. */
export function JoinFields(p: JoinFieldsProps) {
  return (
    <>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Email</span>
        <input
          type="email"
          value={p.email}
          onChange={(e) => p.setEmail(e.target.value)}
          required
          readOnly={p.lockEmail}
          className="mt-1"
          autoComplete="email"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">
          Password you already sign in with
        </span>
        <input
          type="password"
          name="password"
          value={p.password}
          onChange={(e) => p.setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1"
          autoComplete="current-password"
        />
        <span className="block mt-1 text-xs text-[var(--text-muted)]">
          Same as Sign in — not a new password.
        </span>
      </label>
    </>
  );
}
