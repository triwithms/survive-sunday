import { auth } from "@/lib/auth";
import { getMembershipForUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImportPicksForm } from "@/components/ImportPicksForm";
import { CommissionerSwitch } from "@/components/CommissionerSwitch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ImportPicksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getMembershipForUser(session.user.id);
  if (!me) redirect("/join");
  if (me.role !== "admin") {
    return (
      <div className="card-glass p-5 space-y-4">
        <div>
          <h1 className="font-display text-2xl text-gold-400 tracking-wide">
            Commissioner only
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">
            Import is available to the pool commissioner. Switch to the
            Commissioner demo account to continue.
          </p>
        </div>
        <CommissionerSwitch />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gold-400">
          ← Commissioner
        </Link>
        <h1 className="font-display text-2xl text-gold-400 tracking-wide mt-2">
          Import week picks
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Week 1 is already in progress. Import picks the group made outside
          Survive Sunday — they count for visibility, grading, mulligan, and
          team reuse. Source is marked <span className="font-mono">imported</span>{" "}
          and every change is audited.
        </p>
      </div>

      <ImportPicksForm defaultWeek={me.pool.currentWeek} />

      <section className="card-glass p-4 text-sm space-y-2">
        <h2 className="font-semibold">Format</h2>
        <p className="text-[var(--text-muted)]">
          CSV or paste: <span className="font-mono">nickname,team</span> or{" "}
          <span className="font-mono">email,team</span> — one row per player.
          Rows are matched by <strong>exact nickname first</strong>, then email.
          Use <strong>Preview matches</strong> to confirm nickname→team before commit.
        </p>
        <a
          href="/examples/week1-picks-import.csv"
          className="text-gold-400 underline"
          download
        >
          Download example week1-picks-import.csv
        </a>
      </section>
    </div>
  );
}
