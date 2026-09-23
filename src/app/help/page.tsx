import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { HelpContent } from "@/components/HelpContent";
import { A2hsNudge } from "@/components/features/a2hs";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { BottomNav } from "@/components/BottomNav";
import { ChromeInsets } from "@/components/ChromeInsets";

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
    <div className="min-h-dvh flex flex-col max-w-full">
      <div className="flex-1 min-w-0 overflow-x-clip">
        <main className="mx-auto w-full max-w-pool pb-8 pt-[calc(2rem+env(safe-area-inset-top))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
          <Link
            href={membership ? "/pick" : "/"}
            className="inline-flex min-h-11 items-center text-sm text-gold-400"
          >
            ← {membership ? "My pick" : "Survive Sunday"}
          </Link>
          <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-6 mb-6">
            Help
          </h1>
          <HelpContent />
        </main>
        <FooterDisclaimer />
      </div>
      {membership && <BottomNav isAdmin={roleView === "admin"} />}
      <A2hsNudge />
      <ChromeInsets />
    </div>
  );
}
