import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPoolContext } from "@/lib/session";
import {
  missingProfileFields,
  snapshotFromMember,
} from "@/lib/profile-complete";
import { CompleteProfileForm } from "@/components/features/profile";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ctx = await getUserPoolContext(session.user.id);
  if (!ctx.membership) redirect("/join");

  const snap = snapshotFromMember(ctx.membership);
  const missing = missingProfileFields(snap);
  if (missing.length === 0) redirect("/pick");

  return (
    <main className="min-h-dvh mx-auto max-w-sheet px-4 py-10">
      <h1 className="font-display text-3xl text-gold-400 mb-2">
        Almost in
      </h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        One time — add what’s missing, then you’re in the pool.
      </p>
      <CompleteProfileForm
        missing={missing}
        nickname={snap.nickname ?? ""}
        fullName={(snap.realName || snap.userName || "").trim()}
      />
    </main>
  );
}
