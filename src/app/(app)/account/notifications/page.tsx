import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationPrefsForm } from "@/components/NotificationPrefsForm";
import { ensureNotificationPrefs } from "@/lib/notification-prefs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotificationPrefsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const prefs = await ensureNotificationPrefs(session.user.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/help#8-notifications" className="text-gold-400">
            Help
          </Link>
          {" · "}
          Account
        </p>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-1">
          Notification preferences
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          Choose what Survive Sunday emails you. Missing-pick texts follow the
          same switch if you saved a cell. Password-reset codes always send when
          you ask for one.
        </p>
      </div>
      <NotificationPrefsForm initial={prefs} />
    </div>
  );
}
