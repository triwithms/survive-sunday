import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { JoinForm } from "@/components/JoinForm";
import { peekInviteToken } from "@/lib/invite-token-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JoinSearch = { t?: string | string[] };

/** Admin / already-signed-in deep link only. Cold entry is Sign in. */
export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<JoinSearch>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = searchParams ? await searchParams : undefined;
  const raw = params?.t;
  const token = Array.isArray(raw) ? raw[0] : raw;
  const peeked = token
    ? await peekInviteToken(token).catch(() => null)
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
        tokenSeatId={peeked?.membershipId}
      />
    </Suspense>
  );
}
