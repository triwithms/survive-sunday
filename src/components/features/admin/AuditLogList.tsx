import { Card } from "@/components/ui";
import { auditDetail, auditTitle, auditWhen } from "./audit-labels";
import type { AuditLogRow } from "./types";

export function AuditLogList({ logs }: { logs: AuditLogRow[] }) {
  return (
    <section data-testid="audit-log">
      <h2 className="font-semibold mb-2">Audit log</h2>
      {logs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nothing recorded yet.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {logs.map((row) => {
            const detail = auditDetail(row.details);
            return (
              <Card as="li" key={row.id} className="p-3 space-y-0.5">
                <p className="text-sm font-medium text-gold-400">
                  {auditTitle(row.action)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {auditWhen(row.createdAt)}
                </p>
                {detail ? (
                  <p className="text-sm break-words">{detail}</p>
                ) : null}
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
