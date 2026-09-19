import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationPrefsForm } from "@/components/NotificationPrefsForm";
import { loadNotifyPref } from "@/lib/notify-pref-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotificationPrefsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { pref } = await loadNotifyPref(session.user.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/account" prefetch={false} className="text-gold-400">
            ← Settings
          </Link>
          {" · "}
          <Link href="/help#account" className="text-gold-400">
            Help
          </Link>
        </p>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-1">
          Notification preferences
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Choose SMS, Email, both, or none. Password-reset codes still send when
          you ask. Path: Account (header) → Notification preferences.
        </p>
      </div>
      <NotificationPrefsForm initial={pref} />
    </div>
  );
}
