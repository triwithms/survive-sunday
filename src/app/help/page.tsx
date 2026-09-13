import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { HelpContent } from "@/components/HelpContent";
import { isDemoMode } from "@/lib/pool-mode";
import { getPrimaryPoolMode } from "@/lib/pool-mode-db";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HelpPage() {
  const session = await auth();
  const membership = session?.user?.id
    ? await getMembershipForUser(session.user.id)
    : null;
  const demoMode = membership
    ? isDemoMode(membership.pool.mode)
    : isDemoMode(await getPrimaryPoolMode());

  return (
    <div
      className={
        membership ? "min-h-dvh flex flex-col pb-24" : "min-h-dvh flex flex-col"
      }
    >
      <main className="flex-1 mx-auto w-full max-w-pool px-4 py-8">
        <Link href={membership ? "/pool" : "/"} className="text-sm text-gold-400">
          ← {membership ? "Pool" : "Survive Sunday"}
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-6 mb-2">
          Help
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Canadian English · 2026/27 · Wave 1 live / Wave 2 coming soon
        </p>
        <HelpContent showDemoCopy={demoMode} />
      </main>
      <FooterDisclaimer />
      {membership && <BottomNav isAdmin={membership.role === "admin"} />}
    </div>
  );
}
