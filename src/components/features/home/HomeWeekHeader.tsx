import { formatKickoff } from "@/lib/utils";

export function HomeWeekHeader({
  label,
  lockAt,
  revealAllPicks,
}: {
  label: string;
  lockAt: Date;
  revealAllPicks: boolean;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl tracking-wide text-gold-400">
        Selections
      </h1>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        {label} · Picks reveal: {formatKickoff(lockAt)}
        {revealAllPicks ? " · Revealed" : " · Others hidden"}
      </p>
    </div>
  );
}
