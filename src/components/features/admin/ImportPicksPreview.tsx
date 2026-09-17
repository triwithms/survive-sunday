import type { ImportPreviewRow } from "./import-picks-types";

export function ImportPicksPreview({ preview }: { preview: ImportPreviewRow[] }) {
  const ok = preview.filter((r) => r.ok).length;
  const failed = preview.length - ok;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gold-400">
        Preview — {ok} ok · {failed} failed
      </h3>
      <ul className="text-xs space-y-1 max-h-64 overflow-y-auto">
        {preview.map((r, i) => (
          <li
            key={`${r.nickname}-${r.teamAbbr}-${i}`}
            className={`font-mono p-2 rounded ${
              r.ok ? "bg-stadium-900" : "bg-crimson-950/40 text-crimson-400"
            }`}
          >
            {r.ok ? "✓" : "✗"} {r.nickname || r.input} → {r.teamAbbr || "?"}
            {r.matchBy ? ` (via ${r.matchBy})` : ""}
            {r.existingTeam
              ? ` · was ${r.existingTeam}${r.existingResult ? `/${r.existingResult}` : ""}`
              : ""}
            {r.error ? ` — ${r.error}` : ""}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--text-muted)]">
        Confirm only after the nickname→team mapping looks right.
      </p>
    </div>
  );
}
