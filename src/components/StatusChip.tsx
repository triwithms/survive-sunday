import { STATUS_LABELS } from "@/lib/constants";

export function StatusChip({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status;
  const cls =
    status === "undefeated"
      ? "chip-gold"
      : status === "one_loss"
        ? "chip-one-loss"
        : "chip-eliminated";
  return <span className={`chip ${cls}`}>{label}</span>;
}
