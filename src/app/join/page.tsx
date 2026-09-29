import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";
import { peekInviteToken } from "@/lib/invite-token-db";
import { resolveWhoJoinSeat } from "@/lib/join-target";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JoinSearch = {
  t?: string | string[];
  seat?: string | string[];
  who?: string | string[];
  pool?: string | string[];
};

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

/** Admin / already-signed-in deep link only. Cold entry is Sign in. */
export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<JoinSearch>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = searchParams ? await searchParams : undefined;
  const token = first(params?.t);
  const peeked = token
    ? await peekInviteToken(token).catch(() => null)
    : null;
  const whoSeat =
    !peeked && !first(params?.seat)
      ? await resolveWhoJoinSeat({
          who: first(params?.who),
          poolId: first(params?.pool),
        }).catch(() => null)
      : null;

  return (
    <Suspense
      fallback={
        <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
          <p className="text-[var(--text-muted)] text-sm">Loading…</p>
        </main>
      }
    >
      <JoinForm
        seats={[]}
        signedIn={{
          email: session.user.email ?? "",
          userId: session.user.id,
        }}
        tokenSeatId={peeked?.membershipId ?? whoSeat}
      />
    </Suspense>
  );
}
