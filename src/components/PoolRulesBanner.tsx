import { poolRulesPlayerLabel } from "@/lib/pool-rules";

export function PoolRulesBanner({
  singleEliminationFromWeek,
  compact = false,
}: {
  singleEliminationFromWeek: number | null | undefined;
  compact?: boolean;
}) {
  const label = poolRulesPlayerLabel(singleEliminationFromWeek);
  if (!label) return null;

  return (
    <div
      className={
        compact
          ? "border-b border-gold-400/40 bg-gold-400/15"
          : "card-glass border border-gold-400/40 p-3 mb-4"
      }
      role="status"
    >
      <p
        className={
          compact
            ? "mx-auto max-w-pool px-3 py-2.5 text-center text-sm font-semibold text-gold-400"
            : "text-sm font-semibold text-gold-400"
        }
      >
        {label}
      </p>
    </div>
  );
}
