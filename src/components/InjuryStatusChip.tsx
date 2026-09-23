import { injuryTone } from "@/lib/nfl-player";

export function InjuryStatusChip({
  status,
  compact,
}: {
  status: string;
  compact?: boolean;
}) {
  const tone = injuryTone(status);
  const cls =
    tone === "out"
      ? "chip-eliminated"
      : tone === "doubtful"
        ? "chip-one-loss"
        : tone === "questionable"
          ? "chip-gold"
          : "chip-one-loss";
  return (
    <span className={`chip ${cls} ${compact ? "text-[10px]" : "text-xs"}`}>
      {status}
    </span>
  );
}
