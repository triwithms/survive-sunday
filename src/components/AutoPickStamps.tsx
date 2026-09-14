import {
  autoPickStampCount,
  autoPickStampsTitle,
  formatAutoPickStamps,
} from "@/lib/auto-pick-stamps";

export function AutoPickStamps({
  count,
}: {
  count?: number | null;
}) {
  const n = autoPickStampCount(count);
  if (n <= 0) return null;
  return (
    <span
      className="ml-1 whitespace-nowrap"
      title={autoPickStampsTitle(n)}
      aria-label={autoPickStampsTitle(n)}
    >
      {formatAutoPickStamps(n)}
    </span>
  );
}
