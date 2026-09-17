"use client";

import { Button } from "@/components/ui";

type Props = {
  weekNumber: number;
  csv: string;
  overrideReuse: boolean;
  busy: boolean;
  canCommit: boolean;
  hasPreview: boolean;
  onWeek: (n: number) => void;
  onFile: (file: File) => void;
  onCsv: (value: string) => void;
  onOverride: (value: boolean) => void;
  onPreview: () => void;
  onCommit: () => void;
};

export function ImportPicksFields(props: Props) {
  return (
    <>
      <p className="text-xs text-[var(--text-muted)]">
        Matching order:{" "}
        <strong className="text-[var(--text)]">exact nickname</strong> first
        (case-insensitive), then email.
      </p>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Week to import into</span>
        <input
          type="number"
          min={1}
          max={18}
          value={props.weekNumber}
          onChange={(e) => props.onWeek(Number(e.target.value))}
          className="mt-1"
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Upload CSV</span>
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          className="mt-1"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) props.onFile(f);
          }}
        />
      </label>
      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Bulk paste</span>
        <textarea
          rows={10}
          value={props.csv}
          onChange={(e) => props.onCsv(e.target.value)}
          className="mt-1 font-mono text-xs"
          spellCheck={false}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={props.overrideReuse}
          onChange={(e) => props.onOverride(e.target.checked)}
          className="w-4 h-4"
        />
        Allow team-reuse override (audited)
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button className="flex-1" disabled={props.busy} onClick={props.onPreview}>
          {props.busy && !props.hasPreview ? "Resolving…" : "Preview matches"}
        </Button>
        <Button className="flex-1" disabled={props.busy || !props.canCommit} onClick={props.onCommit}>
          {props.busy && props.hasPreview ? "Importing…" : "Confirm import"}
        </Button>
      </div>
    </>
  );
}
