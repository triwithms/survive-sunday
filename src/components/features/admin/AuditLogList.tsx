import { Card } from "@/components/ui";
import type { AuditLogRow } from "./types";

export function AuditLogList({ logs }: { logs: AuditLogRow[] }) {
  return (
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
  );
}
