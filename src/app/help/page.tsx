import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { HelpContent } from "@/components/HelpContent";
import { A2hsNudge, HelpInstallLink } from "@/components/features/a2hs";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { BottomNav } from "@/components/BottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HelpPage() {
  const session = await auth();
  const ctx = session?.user?.id
    ? await getUserPoolContext(session.user.id)
    : null;
  const membership = ctx?.membership ?? null;
  const cookieStore = await cookies();
  const roleView = resolveRoleView({
    isPlayer: Boolean(ctx?.isPlayer),
    isAdmin: Boolean(ctx?.isAdmin),
    requested: cookieStore.get(ROLE_VIEW_COOKIE)?.value,
  });

  return (
    <div
      className={
        membership ? "min-h-dvh flex flex-col pb-24" : "min-h-dvh flex flex-col"
      }
    >
      <main className="flex-1 mx-auto w-full max-w-pool pb-8 pt-[calc(2rem+env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <Link
          href={membership ? "/pick" : "/"}
          className="inline-flex min-h-11 items-center text-sm text-gold-400"
        >
          ← {membership ? "My pick" : "Survive Sunday"}
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-6 mb-2">
          Help
        </h1>
        <p className="mb-3">
          <HelpInstallLink />
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Canadian English · 2026/27 · Wave 1 live / Wave 2 coming soon
        </p>
        <HelpContent showDemoCopy={false} />
      </main>
      <FooterDisclaimer />
      {membership && <A2hsNudge />}
      {membership && <BottomNav isAdmin={roleView === "admin"} />}
    </div>
  );
}
