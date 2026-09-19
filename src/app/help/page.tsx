import Link from "next/link";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import { ROLE_VIEW_COOKIE, resolveRoleView } from "@/lib/roles";
import { HelpContent } from "@/components/HelpContent";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { BottomNav } from "@/components/BottomNav";
import { SignOutButton } from "@/components/SignOutButton";

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
      <main className="flex-1 mx-auto w-full max-w-pool px-4 py-8">
        <Link href={membership ? "/pick" : "/"} className="text-sm text-gold-400">
          ← {membership ? "My pick" : "Survive Sunday"}
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-6 mb-2">
          Help
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Canadian English · 2026/27 · Wave 1 live / Wave 2 coming soon
        </p>
        {membership && (
          <div className="card-glass p-4 mb-6 space-y-2">
            <p className="text-sm text-[var(--text-primary)] font-medium">
              Signed in as {membership.nickname}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Sign out and notification settings:{" "}
              <strong>Account → Notification preferences</strong>. Also see
              Help section 8.
            </p>
            <Link
              href="/account/notifications"
              className="btn-secondary w-full inline-flex items-center justify-center"
            >
              Notification preferences
            </Link>
            <SignOutButton next="/login" className="btn-danger w-full" />
          </div>
        )}
        <HelpContent showDemoCopy={false} />
      </main>
      <FooterDisclaimer />
      {membership && <BottomNav isAdmin={roleView === "admin"} />}
    </div>
  );
}
