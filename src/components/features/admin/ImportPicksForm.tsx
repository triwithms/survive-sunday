"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { ImportPicksFeedback } from "./ImportPicksFeedback";
import { ImportPicksFields } from "./ImportPicksFields";
import { ImportPicksPreview } from "./ImportPicksPreview";
import {
  DEFAULT_IMPORT_CSV,
  importErrorMessage,
  type ImportFeedback,
  type ImportPreviewRow,
} from "./import-picks-types";

export function ImportPicksForm({ defaultWeek }: { defaultWeek: number }) {
  const router = useRouter();
  const [weekNumber, setWeekNumber] = useState(defaultWeek);
  const [csv, setCsv] = useState(DEFAULT_IMPORT_CSV);
  const [overrideReuse, setOverrideReuse] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null);
  const [feedback, setFeedback] = useState<ImportFeedback | null>(null);

  function clear() {
    setPreview(null);
    setFeedback(null);
  }

  async function post(dryRun: boolean) {
    setBusy(true);
    setFeedback(null);
    const res = await fetch("/api/admin/import-picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekNumber, csv, overrideReuse, dryRun }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFeedback({
        kind: "error",
        message: importErrorMessage(data, dryRun ? "Could not preview these picks." : "Could not import these picks."),
        details: data,
      });
      if (dryRun) setPreview(null);
      return;
    }
    if (dryRun) {
      setPreview(data.preview || []);
      return;
    }
    setFeedback({
      kind: "success",
      weekNumber: data.weekNumber ?? weekNumber,
      imported: data.imported ?? 0,
      failed: data.failed ?? 0,
      details: data,
    });
    setPreview(null);
    router.refresh();
  }

  return (
    <Card className="p-4 space-y-4">
      <ImportPicksFields
        weekNumber={weekNumber}
        csv={csv}
        overrideReuse={overrideReuse}
        busy={busy}
        canCommit={Boolean(preview?.some((r) => r.ok))}
        hasPreview={Boolean(preview)}
        onWeek={(n) => { setWeekNumber(n); clear(); }}
        onFile={async (file) => { setCsv(await file.text()); clear(); }}
        onCsv={(value) => { setCsv(value); clear(); }}
        onOverride={(value) => { setOverrideReuse(value); clear(); }}
        onPreview={() => void post(true)}
        onCommit={() => void post(false)}
      />
      {preview ? <ImportPicksPreview preview={preview} /> : null}
      {feedback ? <ImportPicksFeedback feedback={feedback} /> : null}
    </Card>
  );
}
