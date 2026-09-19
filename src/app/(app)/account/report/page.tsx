import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportBugForm } from "@/components/features/account/ReportBugForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportBugPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/account" prefetch={false} className="text-gold-400">
            ← Settings
          </Link>
        </p>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-1">
          Report a bug or idea
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          We’ll send this to every Administrator in the pool — email, and SMS
          when that Administrator’s alert preference allows it.
        </p>
      </div>
      <ReportBugForm />
    </div>
  );
}
