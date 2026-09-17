import { ImportPicksForm } from "@/components/ImportPicksForm";
import {
  AdminDenied,
  AdminHeading,
  loadAdminGate,
} from "@/components/features/admin";
import { Card } from "@/components/ui";
import { effectiveCurrentWeek, isDemoMode } from "@/lib/pool-mode";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ImportPicksPage() {
  const gate = await loadAdminGate();
  if (!gate.ok) return <AdminDenied isDemo={gate.isDemo} />;
  const suggestedWeek = effectiveCurrentWeek(
    gate.me.pool.mode,
    gate.me.pool.currentWeek
  );
  const demo = isDemoMode(gate.me.pool.mode);
  return (
    <div className="space-y-6">
      <AdminHeading title="Import week picks">
        Import picks made outside Survive Sunday. Source is marked{" "}
        <span className="font-mono">imported</span> and every change is audited.
        {demo
          ? " Week 1 may already have seeded practice picks. Reset the pool first if you want a clean import."
          : " If the board still has old picks, use System → Reset pool first."}{" "}
        After import, open Pool or Scores for that week.
      </AdminHeading>
      <ImportPicksForm defaultWeek={suggestedWeek} />
      <Card as="section" className="p-4 text-sm space-y-2">
        <h2 className="font-semibold">Format</h2>
        <p className="text-[var(--text-muted)]">
          CSV or paste: <span className="font-mono">nickname,team</span> or{" "}
          <span className="font-mono">email,team</span> — one row per player.
          Rows match by <strong>exact nickname first</strong>, then email. Use{" "}
          <strong>Preview matches</strong> before commit.
        </p>
        <a
          href="/examples/week1-picks-import.csv"
          className="text-gold-400 underline"
          download
        >
          Download example week1-picks-import.csv
        </a>
      </Card>
    </div>
  );
}
