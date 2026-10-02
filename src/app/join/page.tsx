import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";
import { loginReturnForInvite } from "@/lib/entry-path";
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

/**
 * Token, seat, or nickname invite only.
 * Bare /join (and any invite-code screen) is Sign in.
 */
export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<JoinSearch>;
}) {
  const session = await auth();
  const params = searchParams ? await searchParams : undefined;
  const token = first(params?.t);
  const seat = first(params?.seat);
  const who = first(params?.who);
  const pool = first(params?.pool);
  const back = loginReturnForInvite({ token, seat, who, pool });

  if (!session?.user?.id) redirect(back);

  const peeked = token
    ? await peekInviteToken(token).catch(() => null)
    : null;
  const whoSeat =
    !peeked && !seat
      ? await resolveWhoJoinSeat({ who, poolId: pool }).catch(() => null)
      : null;
  const inviteSeat = peeked?.membershipId || seat || whoSeat;
  if (!inviteSeat) redirect("/login");

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
        tokenSeatId={inviteSeat}
      />
    </Suspense>
  );
}
