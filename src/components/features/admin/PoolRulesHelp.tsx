export function PoolRulesHelp({
  oneLossCount,
  undefeatedCount,
  enabled,
  fromWeek,
}: {
  oneLossCount: number;
  undefeatedCount: number;
  enabled: boolean;
  fromWeek: number;
}) {
  return (
    <div className="text-xs text-[var(--text-muted)] space-y-2">
      <p>
        <strong className="text-[var(--text-primary)]">
          Safe for people already on One loss:
        </strong>{" "}
        {oneLossCount} player{oneLossCount === 1 ? "" : "s"} already used their
        mulligan. They stay in. Their next loss still puts them out.
      </p>
      <p>
        {undefeatedCount} player{undefeatedCount === 1 ? "" : "s"} still have an
        unused mulligan. From the week you choose, that unused mulligan will
        not save them.
      </p>
      <p>
        Already-scored weeks are not re-graded. We do not go back and eliminate
        anyone for an old loss.
      </p>
      <p>
        Players will see:{" "}
        <span className="text-gold-400">
          {enabled
            ? `From Week ${fromWeek}: no mulligan / one-and-done.`
            : "the usual mulligan rule."}
        </span>
      </p>
    </div>
  );
}
