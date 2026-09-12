"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreviewRow = {
  input: string;
  nickname: string;
  email?: string;
  teamAbbr: string;
  ok: boolean;
  error?: string;
  matchBy?: "nickname" | "email";
  existingTeam?: string | null;
  existingResult?: string | null;
};

export function ImportPicksForm({ defaultWeek }: { defaultWeek: number }) {
  const [weekNumber, setWeekNumber] = useState(defaultWeek);
  const [csv, setCsv] = useState(
    "nickname,team\nAurora,KC\nBeacon,BUF\nCedar,PHI\nDrift,DET\nEmber,HOU\nFrost,BAL\nGrove,SF\nIris,GB\n"
  );
  const [overrideReuse, setOverrideReuse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [result, setResult] = useState<string>("");
  const router = useRouter();

  async function onFile(file: File) {
    const text = await file.text();
    setCsv(text);
    setPreview(null);
  }

  async function runPreview() {
    setBusy(true);
    setResult("");
    const res = await fetch("/api/admin/import-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber, csv, overrideReuse, dryRun: true }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setResult(JSON.stringify(data, null, 2));
      setPreview(null);
      return;
    }
    setPreview(data.preview || []);
    setResult("");
  }

  async function commit() {
    setBusy(true);
    setResult("");
    const res = await fetch("/api/admin/import-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber, csv, overrideReuse, dryRun: false }),
    });
    const data = await res.json();
    setBusy(false);
    setResult(JSON.stringify(data, null, 2));
    if (res.ok) {
      setPreview(null);
      router.refresh();
    }
  }

  return (
    <div className="card-glass p-4 space-y-4">
      <p className="text-xs text-[var(--text-muted)]">
        Matching order: <strong className="text-[var(--text)]">exact nickname</strong> first
        (case-insensitive), then email. Preview resolves nickname→team before commit.
      </p>

      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Week number</span>
        <input
          type="number"
          min={1}
          max={18}
          value={weekNumber}
          onChange={(e) => {
            setWeekNumber(Number(e.target.value));
            setPreview(null);
          }}
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
            if (f) onFile(f);
          }}
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--text-muted)]">Bulk paste</span>
        <textarea
          rows={10}
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
          }}
          className="mt-1 font-mono text-xs"
          spellCheck={false}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={overrideReuse}
          onChange={(e) => {
            setOverrideReuse(e.target.checked);
            setPreview(null);
          }}
          className="w-4 h-4"
        />
        Allow team-reuse override (audited — for mid-season import edge cases)
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={busy}
          onClick={runPreview}
        >
          {busy && !preview ? "Resolving…" : "Preview matches"}
        </button>
        <button
          type="button"
          className="btn-primary flex-1"
          disabled={busy || !preview || !preview.some((r) => r.ok)}
          onClick={commit}
        >
          {busy && preview ? "Importing…" : "Confirm import"}
        </button>
      </div>

      {preview && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gold-400">
            Preview — {preview.filter((r) => r.ok).length} ok ·{" "}
            {preview.filter((r) => !r.ok).length} failed
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
            Confirm only after the nickname→team mapping looks right. Re-importing the same
            graded pick will not re-burn mulligans or inflate weeks survived.
          </p>
        </div>
      )}

      {result && (
        <pre className="text-xs font-mono bg-stadium-950 p-3 rounded-lg overflow-x-auto max-h-80">
          {result}
        </pre>
      )}
    </div>
  );
}
