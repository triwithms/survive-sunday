import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NotificationPrefsForm } from "@/components/NotificationPrefsForm";
import { ensureNotificationPrefsSafe } from "@/lib/notification-prefs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NotificationPrefsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { prefs, error } = await ensureNotificationPrefsSafe(session.user.id);

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
          Choose what Survive Sunday emails you. Add your cell for SMS
          missing-pick reminders — those texts follow the same Missing pick
          reminder switch. Password-reset codes always send when you ask for
          one. Path: Account (header) → Notification preferences.
        </p>
      </div>
      <NotificationPrefsForm initial={prefs} initialError={error} />
    </div>
  );
}
