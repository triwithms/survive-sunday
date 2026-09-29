import Link from "next/link";
import { PoolJoinForm } from "@/components/features/join/PoolJoinForm";
import { peekPoolInvite } from "@/lib/pool-invite-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim();
}

export default async function PoolJoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ t?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const token = first(params?.t);
  const invite = token ? await peekPoolInvite(token).catch(() => null) : null;

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <Link href="/login" className="text-sm text-gold-400">
        ← Sign in
      </Link>
      <h1 className="font-display text-3xl text-gold-400 mt-6 mb-2">
        Join a pool
      </h1>
      {invite ? (
        <PoolJoinForm token={token} poolName={invite.name} />
      ) : (
        <p className="text-sm text-[var(--text-muted)] mt-4">
          This join link is off or not valid. Ask your pool administrator for
          a new one. If you already have a password, sign in.
        </p>
      )}
    </main>
  );
}
