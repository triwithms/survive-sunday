import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { listClaimableSeats } from "@/lib/claim-seat-db";
import type { ClaimableSeat } from "@/lib/claim-seat";
import { JoinForm } from "@/components/JoinForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JoinPage() {
  const session = await auth();
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
      <JoinForm seats={seats} signedIn={signedIn} />
    </Suspense>
  );
}
