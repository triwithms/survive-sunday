"use client";

type Props = {
  email: string;
  phone: string;
  disabled: boolean;
  onEmail: (value: string) => void;
  onPhone: (value: string) => void;
};

export function RosterContactFields({
  email,
  phone,
  disabled,
  onEmail,
  onPhone,
}: Props) {
  return (
    <>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          disabled={disabled}
          className="mt-1"
          autoComplete="off"
          inputMode="email"
          data-testid="roster-email"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Cell phone</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          disabled={disabled}
          className="mt-1"
          autoComplete="off"
          inputMode="tel"
          placeholder="(416) 951-4262"
          data-testid="roster-phone"
        />
      </label>
    </>
  );
}
