import { SignOutButton } from "@/components/SignOutButton";

/** Signed in, but not in a pool. Stay on Sign in — do not open Join. */
export function SeatlessSession({ email }: { email: string }) {
  const who = email.trim();
  return (
    <div className="mx-auto max-w-sheet px-5 pt-8">
      <p className="text-sm text-[var(--text-muted)]">
        {who
          ? `${who} is signed in on this phone, but that login is not in a pool. Sign out, then sign in with the pool email.`
          : "This phone is signed in, but that login is not in a pool. Sign out, then sign in with the pool email."}
      </p>
      <div className="mt-3">
        <SignOutButton next="/login">Sign out</SignOutButton>
      </div>
    </div>
  );
}
