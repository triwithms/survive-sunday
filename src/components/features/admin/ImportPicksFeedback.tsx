import Link from "next/link";
import type { ImportFeedback } from "./import-picks-types";

export function ImportPicksFeedback({ feedback }: { feedback: ImportFeedback }) {
  if (feedback.kind === "error") {
    return (
      <div className="rounded-lg border border-crimson-500/40 bg-crimson-950/30 p-4" role="alert">
        <p className="text-sm text-crimson-300">{feedback.message}</p>
        {feedback.details !== undefined ? (
          <details className="text-xs mt-2">
            <summary className="cursor-pointer text-[var(--text-muted)]">Error details</summary>
            <pre className="mt-2 font-mono bg-stadium-950 p-3 rounded-lg overflow-x-auto max-h-80">
              {JSON.stringify(feedback.details, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 p-4 space-y-3" role="status">
      <h3 className="font-semibold text-emerald-300">
        Imported {feedback.imported} picks for Week {feedback.weekNumber}
      </h3>
      {feedback.imported === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Nothing new imported.</p>
      ) : feedback.failed > 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          {feedback.failed} row{feedback.failed === 1 ? "" : "s"} could not be imported.
        </p>
      ) : null}
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href={`/pool?week=${feedback.weekNumber}`} prefetch={false} className="btn-primary flex-1 text-center">
          Open Pool · Week {feedback.weekNumber}
        </Link>
        <Link href={`/scores?week=${feedback.weekNumber}`} prefetch={false} className="btn-secondary flex-1 text-center">
          Open Scores · Week {feedback.weekNumber}
        </Link>
      </div>
    </div>
  );
}
