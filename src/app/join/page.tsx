import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { listClaimableSeats } from "@/lib/claim-seat-db";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { JoinForm } from "@/components/JoinForm";
import { peekInviteToken } from "@/lib/invite-token-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JoinSearch = { t?: string | string[] };

export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<JoinSearch>;
}) {
  const session = await auth();
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.t;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const peeked = token
    ? await peekInviteToken(token).catch(() => null)
    : null;

  let seats: ClaimableSeat[] = [];
  try {
    seats = await listClaimableSeats();
  } catch (error) {
    console.error("[join] roster list failed", error);
  }
  const signedIn = session?.user?.id
    ? { email: session.user.email ?? "", userId: session.user.id }
    : null;

  return (
    <Suspense
      fallback={
        <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
          <p className="text-[var(--text-muted)] text-sm">Loading the roster…</p>
        </main>
      }
    >
      <JoinForm
        seats={seats}
        signedIn={signedIn}
        tokenSeatId={peeked?.membershipId}
      />
    </Suspense>
  );
}
