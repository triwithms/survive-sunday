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
          ? "border-b border-gold-400/30 bg-gold-400/10"
          : "card-glass border border-gold-400/30 p-3"
      }
      role="status"
    >
      <p
        className={
          compact
            ? "mx-auto max-w-pool px-3 py-2 text-center text-xs sm:text-sm text-gold-400"
            : "text-sm text-gold-400"
        }
      >
        {label}
      </p>
    </div>
  );
}
