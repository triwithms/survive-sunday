import { Card } from "@/components/ui";
import { auditWhen } from "./audit-labels";
import type { ServerErrorItem } from "./types";

export function ServerErrorList({ rows }: { rows: ServerErrorItem[] }) {
  return (
    <section data-testid="server-errors">
      <h2 className="font-semibold mb-1">Server errors</h2>
      <p className="text-xs text-[var(--text-muted)] mb-2">
        Kept here for 14 days. Vercel Hobby only shows about the last hour of
        function logs.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">None recorded.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {rows.map((row) => (
            <Card as="li" key={row.id} className="p-3 space-y-0.5">
              <p className="text-sm font-medium text-gold-400 break-words">
                {row.route}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {auditWhen(row.createdAt)}
                {row.source ? ` · ${row.source}` : ""}
              </p>
              <p className="text-sm break-words">{row.message}</p>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}
