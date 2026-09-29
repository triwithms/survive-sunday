import { paymentStatusLabel } from "@/lib/payment-tracking";

export function PaymentStatusChip({ status }: { status: string }) {
  const label = paymentStatusLabel(status);
  return (
    <span
      className="shrink-0 rounded-full border border-stadium-border px-2 py-0.5 text-xs text-[var(--text-primary)]"
      data-testid="payment-chip"
      data-payment-status={status}
    >
      {label}
    </span>
  );
}
