import Link from "next/link";

export function JoinClaimedSeat({ label }: { label: string }) {
  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/" className="text-sm text-gold-400">
        ← Survive Sunday
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        This seat is already claimed
      </h1>
      <div className="card-glass p-5 space-y-4" data-testid="join-seat-claimed">
        <p className="text-sm text-[var(--text-primary)]">
          <strong>{label}</strong> already joined the pool. This personal link
          cannot be used again.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          If that’s you, Sign in with the same email you used when you Joined.
        </p>
        <Link
          href="/login"
          className="btn-primary inline-flex items-center justify-center w-full"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
