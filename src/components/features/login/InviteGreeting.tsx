import { INVITE_EXPIRED_MESSAGE } from "@/lib/invite-prefill";

type Props = { nickname: string; expired: boolean };

export function InviteGreeting({ nickname, expired }: Props) {
  if (expired) {
    return (
      <p
        className="mb-5 text-base text-[var(--text-muted)]"
        role="status"
        data-testid="login-invite-expired"
      >
        {INVITE_EXPIRED_MESSAGE}
      </p>
    );
  }
  if (!nickname) return null;
  return (
    <p
      className="mb-5 text-base text-[var(--text-primary)]"
      data-testid="login-invite-greeting"
    >
      Hi {nickname} — sign in to finish your details.
    </p>
  );
}
