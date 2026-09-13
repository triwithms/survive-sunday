import { formatInjuryChip, type InjuryCountBits } from "@/lib/game-display";

export function InjuryChip({
  counts,
  className = "",
}: {
  counts: InjuryCountBits;
  className?: string;
}) {
  const label = formatInjuryChip(counts);
  if (!label) return null;
  return (
    <span className={`chip chip-one-loss text-[10px] ${className}`.trim()}>
      {label}
    </span>
  );
}
