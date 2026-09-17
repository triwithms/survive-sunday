import { DeliveryStatusCard } from "@/components/DeliveryStatusCard";
import { Card } from "@/components/ui";
import { AdminHeading } from "./AdminHeading";
import type { SystemScreenProps } from "./types";

export function SystemScreen({ delivery, logs }: SystemScreenProps) {
  return (
    <div className="space-y-6">
      <AdminHeading title="System">
        Sign-in and reset email status, plus the audit log. Database repair
        stays on the deploy path — not on this screen.
      </AdminHeading>
      <DeliveryStatusCard status={delivery} />
      <section>
        <h2 className="font-semibold mb-2">Audit log</h2>
        <ul className="space-y-1 text-xs font-mono text-[var(--text-muted)] max-h-64 overflow-y-auto">
          {logs.map((row) => (
            <Card as="li" key={row.id} className="p-2">
              <span className="text-gold-400">{row.action}</span> {row.createdAt}
              {row.details ? (
                <div className="truncate opacity-80">{row.details}</div>
              ) : null}
            </Card>
          ))}
        </ul>
      </section>
    </div>
  );
}
